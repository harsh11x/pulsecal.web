#!/usr/bin/env python3
import sys

# Read the file
with open('components/onboarding/DoctorOnboarding.tsx', 'r') as f:
    lines = f.readlines()

# The fields to insert after line 519 (index 518)
fields_to_add = '''
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={user?.firstName || ""}
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">From your account</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    value={user?.lastName || ""}
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">From your account</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender *</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => setFormData({ ...formData, gender: value as typeof formData.gender })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                      <SelectItem value="PREFER_NOT_TO_SAY">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

'''

# Insert after line 519 (index 518)
lines.insert(519, fields_to_add)

# Write back
with open('components/onboarding/DoctorOnboarding.tsx', 'w') as f:
    f.writelines(lines)

print("✅ Successfully added name, DOB, and gender fields to DoctorOnboarding.tsx!")
print("The fields are now visible in Step 2 of doctor registration.")
