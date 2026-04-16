"""
Google Colab artifact builder for hybrid fuzzy search.

How to run in Colab:
1) Upload ecommerce_dataset.csv or mount Drive.
2) Install deps:
    !pip install -q pandas numpy faiss-cpu sentence-transformers
3) Run:
   !python build_search_artifacts_colab.py \
      --input /content/ecommerce_dataset.csv \
      --output /content/search_artifacts \
        --model sentence-transformers/all-MiniLM-L6-v2
4) Download /content/search_artifacts_bundle.zip and copy into backend/artifacts/search
"""

import argparse
import json
import os
import re
import shutil
from collections import defaultdict
from datetime import datetime

import faiss
import numpy as np
import pandas as pd
from sentence_transformers import SentenceTransformer


def normalize_text(val, default=None):
    if pd.isna(val):
        return default
    text = str(val).strip()
    if text in {"", "nan", "None", "[]"}:
        return default
    return text


def normalize_key(val: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", str(val).strip().lower())


def normalize_label(val: str) -> str:
    return re.sub(r"\s+", " ", str(val).strip().lower())


def main(args):
    os.makedirs(args.output, exist_ok=True)

    df = pd.read_csv(args.input)
    required = ["product_id", "title", "description", "price", "rating", "brand", "category", "image_url", "sub_category"]
    missing = [c for c in required if c not in df.columns]
    if missing:
        raise ValueError(f"Missing columns in dataset: {missing}")

    df = df.dropna(subset=["title", "price"]).copy()
    df["brand"] = df["brand"].apply(lambda x: normalize_text(x, "generic"))
    df["category"] = df["category"].apply(lambda x: normalize_text(x, "general"))
    df["sub_category"] = df["sub_category"].apply(lambda x: normalize_text(x, "general"))
    df["description"] = df["description"].apply(lambda x: normalize_text(x, ""))

    label_sets = {
        "sub_category": sorted(set(normalize_label(x) for x in df["sub_category"].tolist() if x)),
        "category": sorted(set(normalize_label(x) for x in df["category"].tolist() if x)),
        "brand": sorted(set(normalize_label(x) for x in df["brand"].tolist() if x)),
    }

    postings = {
        "sub_category": defaultdict(set),
        "category": defaultdict(set),
        "brand": defaultdict(set),
    }

    metadata_items = []
    corpus_text = []
    id_map = []

    for _, row in df.iterrows():
        pid = int(row["product_id"])
        title = normalize_text(row["title"], "")
        desc = normalize_text(row["description"], "")
        brand = normalize_label(row["brand"])
        category = normalize_label(row["category"])
        sub_category = normalize_label(row["sub_category"])

        postings["sub_category"][sub_category].add(pid)
        postings["category"][category].add(pid)
        postings["brand"][brand].add(pid)

        metadata_items.append({
            "id": pid,
            "category": category,
            "sub_category": sub_category,
            "brand": brand,
        })

        text_blob = f"{title} {sub_category} {category} {brand} {desc}".strip()
        corpus_text.append(text_blob)
        id_map.append(pid)

    model = SentenceTransformer(args.model, device=args.device)
    dense = model.encode(
        corpus_text,
        batch_size=args.batch_size,
        show_progress_bar=True,
        normalize_embeddings=True,
        convert_to_numpy=True,
    ).astype("float32")

    # normalize_embeddings=True already produces unit-norm vectors; no need to re-normalize

    index = faiss.IndexFlatIP(dense.shape[1])
    index.add(dense)

    faiss.write_index(index, os.path.join(args.output, "semantic_faiss.index"))
    np.save(os.path.join(args.output, "semantic_id_map.npy"), np.array(id_map, dtype=np.int64))
    with open(os.path.join(args.output, "id_mapping.json"), "w", encoding="utf-8") as f:
        json.dump([int(x) for x in id_map], f, ensure_ascii=False)

    postings_out = {
        field: {k: sorted(list(v)) for k, v in values.items()}
        for field, values in postings.items()
    }

    with open(os.path.join(args.output, "lexical_labels.json"), "w", encoding="utf-8") as f:
        json.dump(label_sets, f, ensure_ascii=False)

    with open(os.path.join(args.output, "lexical_postings.json"), "w", encoding="utf-8") as f:
        json.dump(postings_out, f, ensure_ascii=False)

    with open(os.path.join(args.output, "product_metadata.json"), "w", encoding="utf-8") as f:
        json.dump({"items": metadata_items}, f, ensure_ascii=False)

    manifest = {
        "artifact_version": "1.0",
        "created_at": datetime.utcnow().isoformat() + "Z",
        "row_count": int(len(df)),
        "files": [
            "artifact_manifest.json",
            "lexical_labels.json",
            "lexical_postings.json",
            "product_metadata.json",
            "semantic_faiss.index",
            "semantic_id_map.npy",
            "id_mapping.json",
        ],
        "index_type": "faiss_index_flat_ip",
        "semantic_encoder": "sentence-transformers",
        "semantic_model_name": args.model,
        "semantic_dim": int(dense.shape[1]),
        "query_priority": ["sub_category", "category", "brand"],
    }

    with open(os.path.join(args.output, "artifact_manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

    bundle_path = os.path.join(os.path.dirname(args.output), "search_artifacts_bundle")
    if os.path.exists(bundle_path + ".zip"):
        os.remove(bundle_path + ".zip")
    shutil.make_archive(bundle_path, "zip", args.output)

    print(f"Artifacts saved to: {args.output}")
    print(f"Downloadable bundle: {bundle_path}.zip")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=str, required=True)
    parser.add_argument("--output", type=str, default="./search_artifacts")
    parser.add_argument("--model", type=str, default="sentence-transformers/all-MiniLM-L6-v2")
    parser.add_argument("--device", type=str, default="cuda")
    parser.add_argument("--batch_size", type=int, default=256)
    args = parser.parse_args()
    main(args)
