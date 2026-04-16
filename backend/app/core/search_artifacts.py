import json
import os
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import numpy as np

try:
    import faiss  # type: ignore
except Exception:
    faiss = None

try:
    from sentence_transformers import SentenceTransformer
except Exception:
    SentenceTransformer = None


@dataclass
class SearchArtifacts:
    loaded: bool = False
    artifact_dir: str | None = None
    manifest: dict[str, Any] = field(default_factory=dict)
    labels: dict[str, list[str]] = field(default_factory=dict)
    postings: dict[str, dict[str, list[int]]] = field(default_factory=dict)
    id_to_category: dict[int, str] = field(default_factory=dict)
    id_to_sub_category: dict[int, str] = field(default_factory=dict)
    id_to_brand: dict[int, str] = field(default_factory=dict)
    faiss_index: Any = None
    id_map: np.ndarray | None = None
    encoder: Any = None
    semantic_model_name: str | None = None
    errors: list[str] = field(default_factory=list)


SEARCH_ARTIFACTS = SearchArtifacts()


def _safe_json_load(path: Path, default: Any):
    if not path.exists():
        return default
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def _safe_int(value: Any) -> int | None:
    try:
        if value is None:
            return None
        if isinstance(value, (int, np.integer)):
            return int(value)
        text = str(value).strip()
        if text.isdigit():
            return int(text)
        return None
    except Exception:
        return None


def load_search_artifacts() -> SearchArtifacts:
    print("--- [INITIALIZING SEARCH ENGINE] ---")
    artifacts_dir = Path(os.getenv("SEARCH_ARTIFACTS_DIR", "artifacts/search"))
    lean_mode = os.getenv("SEARCH_LEAN_MODE", "false").lower() == "true"
    
    state = SearchArtifacts(artifact_dir=str(artifacts_dir))

    if not artifacts_dir.exists():
        print(f"ERROR: Artifacts directory not found: {artifacts_dir}")
        state.errors.append(f"Artifacts directory not found: {artifacts_dir}")
        _set_state(state)
        return SEARCH_ARTIFACTS

    print(f"Loading metadata from {artifacts_dir}...")
    manifest = _safe_json_load(artifacts_dir / "artifact_manifest.json", {})
    labels = _safe_json_load(artifacts_dir / "lexical_labels.json", {})
    postings = _safe_json_load(artifacts_dir / "lexical_postings.json", {})
    metadata = _safe_json_load(artifacts_dir / "product_metadata.json", {})

    state.manifest = manifest
    state.labels = {
        "sub_category": labels.get("sub_category", []),
        "category": labels.get("category", []),
        "brand": labels.get("brand", []),
    }
    state.postings = {
        "sub_category": postings.get("sub_category", {}),
        "category": postings.get("category", {}),
        "brand": postings.get("brand", {}),
    }

    skipped_metadata_ids = 0
    for row in metadata.get("items", []):
        pid = _safe_int(row.get("id"))
        if pid is None:
            skipped_metadata_ids += 1
            continue
        state.id_to_category[pid] = str(row.get("category") or "")
        state.id_to_sub_category[pid] = str(row.get("sub_category") or "")
        state.id_to_brand[pid] = str(row.get("brand") or "")
    if skipped_metadata_ids:
        state.errors.append(f"Skipped {skipped_metadata_ids} non-integer product IDs in product_metadata.json")

    if faiss is None:
        state.errors.append("faiss not available. Semantic reranking disabled.")
    else:
        index_path = artifacts_dir / "semantic_faiss.index"
        id_map_npy_path = artifacts_dir / "semantic_id_map.npy"
        id_map_json_path = artifacts_dir / "id_mapping.json"
        semantic_encoder = str(manifest.get("semantic_encoder", "")).strip().lower()
        if semantic_encoder and semantic_encoder != "sentence-transformers":
            state.errors.append(
                f"Incompatible semantic_encoder '{semantic_encoder}'. Rebuild artifacts"
            )
        elif index_path.exists() and (id_map_npy_path.exists() or id_map_json_path.exists()):
            try:
                state.faiss_index = faiss.read_index(str(index_path))
                if id_map_npy_path.exists():
                    raw_map = np.load(str(id_map_npy_path))
                    filtered = [pid for pid in (_safe_int(v) for v in raw_map.tolist()) if pid is not None]
                    state.id_map = np.array(filtered, dtype=np.int64)
                else:
                    id_map_json = _safe_json_load(id_map_json_path, [])
                    filtered = [pid for pid in (_safe_int(v) for v in id_map_json) if pid is not None]
                    state.id_map = np.array(filtered, dtype=np.int64)

                if state.id_map.size == 0:
                    raise RuntimeError("No valid integer IDs in semantic id mapping")

                state.semantic_model_name = manifest.get("semantic_model_name", "all-MiniLM-L6-v2")
                
                if lean_mode:
                    print("!!! LEAN MODE ENABLED: Skipping heavy ML model to save RAM !!!")
                    state.errors.append("Lean mode active: AI Re-ranking disabled to save memory.")
                elif SentenceTransformer is None:
                    print("WARNING: sentence-transformers not installed. Skipping AI model.")
                    state.errors.append("sentence-transformers not installed. Semantic reranking disabled.")
                else:
                    print(f"Loading AI model: {state.semantic_model_name} (This may take 45s)...")
                    state.encoder = SentenceTransformer(state.semantic_model_name)
                    print("AI model loaded successfully!")
            except Exception as exc:
                print(f"ERROR: Failed loading semantic artifacts: {exc}")
                state.errors.append(f"Failed loading semantic artifacts: {exc}")
        else:
            print("Notice: Semantic files missing. Re-ranking disabled.")
            state.errors.append("Semantic files missing. Semantic reranking disabled.")

    print(f"Search engine initialized successfully (Total Products: {len(state.id_to_category)})")
    state.loaded = True
    _set_state(state)
    return SEARCH_ARTIFACTS


def _set_state(state: SearchArtifacts):
    global SEARCH_ARTIFACTS
    SEARCH_ARTIFACTS = state
