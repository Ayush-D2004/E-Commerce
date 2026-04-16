import os
import sys
import struct
from sqlalchemy import text
import json
import numpy as np

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.core.database import SessionLocal

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def resolve_artifacts_dir(artifacts_dir: str | None = None) -> str:
    if artifacts_dir:
        if os.path.isabs(artifacts_dir):
            return artifacts_dir
        return os.path.normpath(os.path.join(BACKEND_DIR, artifacts_dir))

    return os.path.normpath(os.path.join(BACKEND_DIR, "artifacts", "search"))

def fix_binary_ids():
    db = SessionLocal()
    print("Fetching recommendation IDs...")
    results = db.execute(text("SELECT id, recommended_product_id FROM product_recommendations")).fetchall()
    
    fixed_count = 0
    for row_id, rec_id in results:
        if isinstance(rec_id, bytes):
            try:
                fixed_id = struct.unpack('<Q', rec_id)[0]
                db.execute(
                    text("UPDATE product_recommendations SET recommended_product_id = :fixed_id WHERE id = :id"),
                    {"fixed_id": fixed_id, "id": row_id}
                )
                fixed_count += 1
            except Exception as e:
                print(f"Failed to fix row {row_id}: {e}")
        
    db.commit()
    print(f"Finished! Fixed {fixed_count} recommendation IDs.")
    db.close()


def ensure_semantic_id_map_npy(artifacts_dir: str | None = None):
    artifacts_dir = resolve_artifacts_dir(artifacts_dir)
    npy_path = os.path.join(artifacts_dir, "semantic_id_map.npy")
    json_path = os.path.join(artifacts_dir, "id_mapping.json")

    if os.path.exists(npy_path):
        print("semantic_id_map.npy already exists.")
        return

    if not os.path.exists(json_path):
        print("No id mapping found (need semantic_id_map.npy or id_mapping.json).")
        return

    with open(json_path, "r", encoding="utf-8") as f:
        id_list = json.load(f)

    parsed_ids = []
    for raw_id in id_list:
        if isinstance(raw_id, int):
            parsed_ids.append(raw_id)
            continue
        if isinstance(raw_id, str):
            token = raw_id.strip()
            if token.startswith("ID_"):
                token = token[3:]
            try:
                parsed_ids.append(int(token))
                continue
            except ValueError:
                digits = "".join(ch for ch in token if ch.isdigit())
                if digits:
                    parsed_ids.append(int(digits))
                    continue
        raise ValueError(f"Unsupported id format in id_mapping.json: {raw_id!r}")

    arr = np.array(parsed_ids, dtype=np.int64)
    np.save(npy_path, arr)
    print(f"Created {npy_path} from id_mapping.json")


def check_artifacts(artifacts_dir: str | None = None):
    artifacts_dir = resolve_artifacts_dir(artifacts_dir)
    print(f"Checking artifacts in: {artifacts_dir}")
    required = [
        "artifact_manifest.json",
        "lexical_labels.json",
        "lexical_postings.json",
        "product_metadata.json",
        "semantic_faiss.index",
    ]
    missing = [name for name in required if not os.path.exists(os.path.join(artifacts_dir, name))]
    if missing:
        print(f"Missing artifact files: {missing}")
    else:
        print("Core artifacts present.")

    has_id_map = (
        os.path.exists(os.path.join(artifacts_dir, "semantic_id_map.npy"))
        or os.path.exists(os.path.join(artifacts_dir, "id_mapping.json"))
    )
    if not has_id_map:
        print("Missing id mapping file (semantic_id_map.npy or id_mapping.json).")
    else:
        print("Id mapping file present.")

    manifest_path = os.path.join(artifacts_dir, "artifact_manifest.json")
    if os.path.exists(manifest_path):
        with open(manifest_path, "r", encoding="utf-8") as f:
            manifest = json.load(f)
        semantic_encoder = str(manifest.get("semantic_encoder", ""))
        if semantic_encoder and semantic_encoder != "sentence-transformers":
            print(
                f"Warning: semantic_encoder is '{semantic_encoder}'. ")
        else:
            print("Semantic encoder is compatible.")

if __name__ == "__main__":
    fix_binary_ids()
    ensure_semantic_id_map_npy()
    check_artifacts()
