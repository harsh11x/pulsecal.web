#!/usr/bin/env python3
# Script to fix existing user signup redirect in AuthForm.tsx

with open('components/auth/AuthForm.tsx', 'r') as f:
    content = f.read()

# Find and replace the error handling section
old_code = '''    } catch (error: any) {
      console.error("Authentication error:", error)

      // Handle specific Firebase errors
      let errorMessage = "An error occurred"
      if (error.code === "auth/user-not-found") {
        errorMessage = "No account found with this email"
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Incorrect password"
      } else if (error.code === "auth/email-already-in-use") {
        errorMessage = "An account with this email already exists"
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password should be at least 6 characters"
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address"
      } else if (error.message) {
        errorMessage = error.message
      }

      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }'''

new_code = '''    } catch (error: any) {
      console.error("Authentication error:", error)

      // Handle specific Firebase errors
      let errorMessage = "An error occurred"
      
      // Special handling for existing users trying to sign up
      if (error.code === "auth/email-already-in-use" && mode === "signup") {
        // User already exists - try to sign them in instead
        try {
          toast.info("Account already exists. Signing you in...")
          await signIn(formData.email, formData.password)
          toast.success("Signed in successfully!")
          router.push("/dashboard")
          return
        } catch (signInError: any) {
          // If sign-in fails, show helpful message
          if (signInError.code === "auth/wrong-password") {
            errorMessage = "Account already exists with this email. Please use the correct password or reset it."
          } else {
            errorMessage = "Account already exists. Please sign in instead."
          }
        }
      } else if (error.code === "auth/user-not-found") {
        errorMessage = "No account found with this email"
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Incorrect password"
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password should be at least 6 characters"
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address"
      } else if (error.message) {
        errorMessage = error.message
      }

      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }'''

# Replace the code
if old_code in content:
    content = content.replace(old_code, new_code)
    with open('components/auth/AuthForm.tsx', 'w') as f:
        f.write(content)
    print("✅ Successfully updated AuthForm.tsx!")
    print("Existing users trying to signup will now be automatically signed in.")
else:
    print("❌ Could not find the exact code to replace.")
    print("The file may have been modified already.")
