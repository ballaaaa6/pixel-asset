#!/usr/bin/env python3
import os
import sys

EXCLUDE_DIRS = {
    '.git', '.agents', 'node_modules', 'dist', 'build', '.wrangler', 'scratch', 'node_modules'
}

def generate_tree(dir_path, prefix=""):
    lines = []
    try:
        entries = sorted(os.scandir(dir_path), key=lambda e: (not e.is_dir(), e.name.lower()))
    except PermissionError:
        return lines
    
    # Filter out entries
    entries = [e for e in entries if e.name not in EXCLUDE_DIRS]
    
    for i, entry in enumerate(entries):
        is_last = (i == len(entries) - 1)
        connector = "└── " if is_last else "├── "
        lines.append(f"{prefix}{connector}{entry.name}{'/' if entry.is_dir() else ''}")
        if entry.is_dir():
            new_prefix = prefix + ("    " if is_last else "│   ")
            lines.extend(generate_tree(entry.path, new_prefix))
            
    return lines

def main():
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    agents_dir = os.path.join(project_root, ".agents")
    index_dir = os.path.join(agents_dir, "index")
    os.makedirs(index_dir, exist_ok=True)
    os.makedirs(os.path.join(agents_dir, "sessions"), exist_ok=True)
    os.makedirs(os.path.join(agents_dir, "topics"), exist_ok=True)
    os.makedirs(os.path.join(agents_dir, "private"), exist_ok=True)
    
    # Write repo tree index
    tree_lines = generate_tree(project_root)
    output_path = os.path.join(index_dir, "repo-tree.md")
    
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("# Repository Tree\n\n")
        f.write("```text\n")
        f.write(".\n")
        for line in tree_lines:
            f.write(line + "\n")
        f.write("```\n")
        
    print(f"Generated repository tree at {output_path}")

if __name__ == "__main__":
    main()
