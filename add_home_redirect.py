#!/usr/bin/env python3
# Add redirect logic to home page for logged-in users

with open('app/page.tsx', 'r') as f:
    content = f.read()

# Check if we need to add imports
if '"use client"' not in content:
    # Add "use client" at the top
    content = '"use client"\n\n' + content

if 'useEffect' not in content:
    # Add useEffect and useRouter imports
    old_import = 'import Image from "next/image"'
    new_import = '''import Image from "next/image"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { store } from "@/app/store"'''
    
    if old_import in content:
        content = content.replace(old_import, new_import)

# Add redirect logic at the start of the component
# Find the export default function
if 'export default function' in content:
    # Add useEffect after the function declaration
    pattern = r'(export default function \w+\(\) \{)'
    replacement = r'''\1
  const router = useRouter()

  // Redirect logged-in users to dashboard
  useEffect(() => {
    const state = store.getState()
    if (state.auth.user) {
      router.push("/dashboard")
    }
  }, [router])
'''
    
    import re
    content = re.sub(pattern, replacement, content)

with open('app/page.tsx', 'w') as f:
    f.write(content)

print("✅ Added redirect logic to home page")
print("Logged-in users will be automatically redirected to dashboard")
