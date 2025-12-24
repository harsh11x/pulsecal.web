#!/bin/bash

# This script adds the name, DOB, and gender fields to DoctorOnboarding.tsx
# Run this from the project root: bash add_doctor_fields.sh

FILE="components/onboarding/DoctorOnboarding.tsx"

# The fields to insert
FIELDS='
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
'

# Insert after line 519
awk -v fields="$FIELDS" 'NR==519{print; print fields; next}1' "$FILE" > "${FILE}.tmp" && mv "${FILE}.tmp" "$FILE"

echo "✅ Fields added to DoctorOnboarding.tsx"
echo "Please review the file and test the doctor registration form"
