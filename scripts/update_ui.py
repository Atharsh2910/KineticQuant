import os
import re

src_dir = r"c:\Users\athar\Desktop\KineticQuantAI\frontend\src"

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # 1. Fix missing Building2 import in SMEDetail.jsx
    if filepath.endswith('SMEDetail.jsx') and 'Building2' not in content:
        content = re.sub(
            r"import { (ArrowLeft.*?) } from 'lucide-react'",
            r"import { \1, Building2 } from 'lucide-react'",
            content
        )
        if 'Building2' not in content:
            # Fallback if first replace failed
            content = content.replace("import { ArrowLeft", "import { ArrowLeft, Building2")

    # 2. Replace Currency $ with Rs. 
    # Match `$42,500` -> `Rs. 42,500`
    content = re.sub(r'\$([0-9])', r'Rs. \1', content)
    # Match `$$` in template literals like `$${val}` -> `Rs. ${val}`
    content = content.replace('$${', 'Rs. ${')
    # Match `>$` -> `>Rs. `
    content = content.replace('>$', '>Rs. ')
    # Match `DollarSign` icon -> keep it or change it? We can keep the icon but change the text.
    # Actually, the user asked to change currency. We should probably keep `DollarSign` import but maybe replace `<DollarSign` with `<IndianRupee` if we wanted to be thorough. Let's just do `DollarSign` -> `IndianRupee` (lucide-react has it).
    content = content.replace('DollarSign', 'IndianRupee')

    # 3. Colors: Vibe to Professional Orange-Black
    # Change backgrounds
    content = content.replace('bg-slate-900', 'bg-zinc-900')
    content = content.replace('bg-slate-800', 'bg-zinc-800')
    content = content.replace('bg-slate-700', 'bg-zinc-700')
    content = content.replace('text-slate-', 'text-zinc-')
    content = content.replace('border-slate-', 'border-zinc-')
    
    # Change brand colors to orange/amber
    content = content.replace('blue-600', 'orange-600')
    content = content.replace('blue-500', 'orange-500')
    content = content.replace('blue-400', 'orange-400')
    
    content = content.replace('purple-600', 'orange-600')
    content = content.replace('purple-500', 'orange-500')
    content = content.replace('purple-400', 'orange-400')
    content = content.replace('purple-300', 'orange-300')
    
    # emerald is used for positive/success. Maybe keep it for trends, but replace where it's used as brand.
    # In SMEDetail header: from-emerald-500 to-emerald-600 -> from-orange-500 to-orange-600
    content = content.replace('from-emerald-500', 'from-orange-500')
    content = content.replace('to-emerald-600', 'to-orange-600')
    content = content.replace('hover:from-emerald-400', 'hover:from-orange-400')
    content = content.replace('hover:to-emerald-500', 'hover:to-orange-500')
    content = content.replace('shadow-emerald-500', 'shadow-orange-500')
    
    # For index.css
    if filepath.endswith('index.css'):
        content = content.replace('--color-obsidian: #090D16', '--color-obsidian: #0a0a0a')
        content = content.replace('--color-slate-900: #111827', '--color-zinc-900: #18181b')
        content = content.replace('--color-slate-800: #1E293B', '--color-zinc-800: #27272a')
        content = content.replace('--color-slate-700: #334155', '--color-zinc-700: #3f3f46')
        content = content.replace('--color-slate-400: #94A3B8', '--color-zinc-400: #a1a1aa')
        content = content.replace('bg-slate-900', 'bg-zinc-900')
        content = content.replace('bg-slate-800', 'bg-zinc-800')
        content = content.replace('rgba(59, 130, 246, 0.5)', 'rgba(249, 115, 22, 0.5)') # text-glow
        content = content.replace('selection:bg-blue-500/30', 'selection:bg-orange-500/30')

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")

for root, dirs, files in os.walk(src_dir):
    for file in files:
        if file.endswith('.jsx') or file.endswith('.css') or file.endswith('.js'):
            process_file(os.path.join(root, file))

