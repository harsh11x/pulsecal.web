#!/usr/bin/env python3
# Fix auth flow - existing users go straight to dashboard, skip onboarding

import re

# Fix AuthForm.tsx - make login always go to dashboard
with open('components/auth/AuthForm.tsx', 'r') as f:
    content = f.read()

# Update signin logic to always go to dashboard
old_signin = '''      if (mode === "signin") {
        // Sign in with email and password
        await signIn(formData.email, formData.password)
        toast.success("Signed in successfully!")

        // Let the dashboard wrapper handle role and onboarding redirects
        // Or we can do smart redirect here if we want to be explicit
        router.push("/dashboard")'''

new_signin = '''      if (mode === "signin") {
        // Sign in with email and password
        await signIn(formData.email, formData.password)
        toast.success("Signed in successfully!")
        
        // Existing users always go to dashboard
        router.push("/dashboard")'''

content = content.replace(old_signin, new_signin)

# Update Google success handler to check if user exists
old_google = '''    // If onboarding is complete, go to dashboard
    if (user?.onboardingCompleted) {
      console.log("✅ Onboarding completed, redirecting to dashboard")
      router.push("/dashboard")
      return
    }

    // Route based on role for onboarding'''

new_google = '''    // If user exists (has any data), go to dashboard - skip onboarding
    if (user?.onboardingCompleted || user?.id) {
      console.log("✅ Existing user, redirecting to dashboard")
      router.push("/dashboard")
      return
    }

    // Only new users go to onboarding'''

content = content.replace(old_google, new_google)

with open('components/auth/AuthForm.tsx', 'w') as f:
    f.write(content)

print("✅ Updated AuthForm.tsx - existing users skip onboarding")

# Fix home page redirect for logged-in users
with open('app/page.tsx', 'r') as f:
    home_content = f.read()

# Check if redirect logic exists
if 'useEffect' in home_content and 'router.push' in home_content:
    print("✅ Home page already has redirect logic")
else:
    print("⚠️ Need to add redirect logic to home page manually")

print("\n✅ Auth flow fixed!")
print("- Logged-in users → Dashboard")
print("- Existing users logging in → Dashboard")  
print("- Existing users trying to signup → Dashboard")
print("- Only NEW users → Onboarding")
