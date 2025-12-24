#!/usr/bin/env python3
# Add auto-logout hook to dashboard layout

with open('app/(dashboard)/layout.tsx', 'r') as f:
    content = f.read()

# Add import for useAutoLogout
if 'useAutoLogout' not in content:
    # Find the imports section
    import_line = 'import { ReactNode } from "react"'
    if import_line in content:
        new_import = '''import { ReactNode } from "react"
import { useAutoLogout } from "@/hooks/useAutoLogout"'''
        content = content.replace(import_line, new_import)
    
    # Add the hook call in the component
    # Find the function body
    if 'export default function DashboardLayout' in content:
        old_func = 'export default function DashboardLayout({ children }: { children: ReactNode }) {'
        new_func = '''export default function DashboardLayout({ children }: { children: ReactNode }) {
  // Auto-logout after 15 minutes of inactivity
  useAutoLogout()
'''
        content = content.replace(old_func, new_func)

with open('app/(dashboard)/layout.tsx', 'w') as f:
    f.write(content)

print("✅ Added auto-logout to dashboard layout")
print("Users will be logged out after 15 minutes of inactivity")
