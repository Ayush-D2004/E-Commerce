import os
import json
import numpy as np

artifacts_dir = os.path.join(os.path.dirname(__file__), '..', 'artifacts', 'search')

print('Loading old id map...')
old_id_map_path = os.path.join(artifacts_dir, 'semantic_id_map.npy')
old_id_map = np.load(old_id_map_path)

print('Creating translation map...')
translation_map = {int(old): int(new) for new, old in enumerate(old_id_map, 1)}

print('Patching semantic_id_map.npy...')
new_id_map = np.arange(1, len(old_id_map) + 1, dtype=np.int64)
np.save(old_id_map_path, new_id_map)

print('Patching id_mapping.json...')
with open(os.path.join(artifacts_dir, 'id_mapping.json'), 'w', encoding='utf-8') as f:
    json.dump([int(x) for x in new_id_map], f)

print('Patching lexical_postings.json...')
lex_path = os.path.join(artifacts_dir, 'lexical_postings.json')
with open(lex_path, 'r', encoding='utf-8') as f:
    lex_data = json.load(f)

for field in lex_data:
    for term in lex_data[field]:
        lex_data[field][term] = [translation_map[old] for old in lex_data[field][term] if old in translation_map]

with open(lex_path, 'w', encoding='utf-8') as f:
    json.dump(lex_data, f)

print('Patching product_metadata.json...')
meta_path = os.path.join(artifacts_dir, 'product_metadata.json')
with open(meta_path, 'r', encoding='utf-8') as f:
    meta_data = json.load(f)

for item in meta_data.get('items', []):
    old_id = item['id']
    if old_id in translation_map:
        item['id'] = translation_map[old_id]

with open(meta_path, 'w', encoding='utf-8') as f:
    json.dump(meta_data, f)

print('SUCCESS')
