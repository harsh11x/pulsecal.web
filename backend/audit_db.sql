SELECT "doctorId", count(*) as appt_count
FROM appointments
GROUP BY "doctorId"
ORDER BY appt_count DESC;
