# Permission matrix

| Capability | Student | Professional | Administrator |
|---|---|---|---|
| Read published resources/daily cards | Yes | Yes | Yes |
| Manage own profile/preferences | Yes | Yes | Yes |
| Change own role | Never | Never | Cannot demote/disable self |
| Submit questions | Own account | No | No |
| Read question text | Own questions | Assigned only | No |
| Identify anonymous question sender | Own identity | Hidden, including follow-up author IDs | Not in assignment responses |
| Read professional notes | No | Assigned case only | No |
| Read/send care messages | Own conversations | Assigned professional conversations | No |
| Read AI/knowledge conversation | Own only | No | No |
| Read check-in/reflection | Own | Explicitly shared item only | No |
| Stop sharing/delete check-in | Own | No | No |
| Book/cancel appointment | Own, subject to rules | Manage own schedule | Scheduling metadata only |
| Referrals | Own | Explicitly supported, identified student | Aggregate counts only |
| Publish content | No | Draft own content only | Yes |
| Invite/activate users and assign roles | No | No | Yes |
| View reports | Own personal history | Assigned/shared records | Suppressed aggregates |
| View audit log | No | No | Metadata, care actor IDs hidden |

Question anonymity is interface anonymity, not an unlinked submission. The server retains the student ID to deliver replies. No promise of complete anonymity or unlimited confidentiality is made.

An assigned **anonymous** question alone does not authorize referral/identity lookup. Professional access to student-linked referrals requires an identified assigned question or assigned professional conversation. Sharing a check-in grants access only to that record; unsharing revokes access immediately on subsequent API reads.

The private `kira` schema is not a Supabase browser API. Roles are read from `profiles.role`, never from client input, editable user metadata, or a frontend route. Changing a role or disabling an account affects the next API request.
