import re

with open("/Users/kanittamac/web/muniflow/prisma/seed-branches.ts", "r", encoding="utf-8") as f:
    content = f.read()

# Extract branchData array block
match = re.search(r"const branchData = \[([\s\S]*?)\];", content)
if not match:
    print("Could not find branchData")
    exit(1)

array_content = match.group(1)

# Find all entries: { code: "...", name: "..." }
items = re.findall(r"{\s*code:\s*\"([^\"]+)\",\s*name:\s*\"([^\"]+)\"\s*}", array_content)

unique_items = []
seen_codes = set()
seen_names = set()

for code, name in items:
    if code not in seen_codes and name not in seen_names:
        unique_items.append((code, name))
        seen_codes.add(code)
        seen_names.add(name)

# Reconstruct array
new_array_lines = ["const branchData = ["]
for code, name in unique_items:
    new_array_lines.append(f"  {{ code: \"{code}\", name: \"{name}\" }},")
# Remove trailing comma conceptually, but TS allows it
new_array_content = "\n".join(new_array_lines) + "\n];"

# Replace in content
new_content = content[:match.start()] + new_array_content + content[match.end():]

with open("/Users/kanittamac/web/muniflow/prisma/seed-branches.ts", "w", encoding="utf-8") as f:
    f.write(new_content)

print(f"Removed duplicates. Total unique branches: {len(unique_items)}")

# Also replace in the mckpi project (change to branchesData and use single quotes for code if needed, but double is fine)
with open("/Users/kanittamac/web/mckpi/prisma/seed.ts", "r", encoding="utf-8") as f:
    mckpi_content = f.read()

mckpi_match = re.search(r"const branchesData = \[([\s\S]*?)\]\n  const branchMap", mckpi_content)
if mckpi_match:
    mckpi_array_lines = ["const branchesData = ["]
    for code, name in unique_items:
        # Use single quotes for consistency in mckpi (though TS does not care)
        mckpi_array_lines.append(f"    {{ code: \'{code}\', name: \'{name}\' }},")
    mckpi_new_array_content = "\n".join(mckpi_array_lines) + "\n  ]"
    mckpi_new_content = mckpi_content[:mckpi_match.start()] + mckpi_new_array_content + "\n  const branchMap" + mckpi_content[mckpi_match.end():]
    
    with open("/Users/kanittamac/web/mckpi/prisma/seed.ts", "w", encoding="utf-8") as f:
        f.write(mckpi_new_content)
    print("Updated mckpi/prisma/seed.ts")
else:
    print("Could not find branchesData in mckpi")
