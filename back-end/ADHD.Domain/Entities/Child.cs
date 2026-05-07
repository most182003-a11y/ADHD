using System;
using System.Collections.Generic;

namespace ADHD.Domain.Entities
{
    public class Child : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public int Age { get; set; }
        public string Gender { get; set; } = string.Empty; // "male" | "female"
        public string DiagnosisSeverity { get; set; } = string.Empty; // "mild" | "moderate" | "severe"
        public DateTime RegisteredDate { get; set; } = DateTime.UtcNow;
        public string Therapist { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty; // "improving" | "stable" | "needs_intervention"
        public string AvatarInitials { get; set; } = string.Empty;

        public ICollection<Session> Sessions { get; set; } = new List<Session>();
    }
}
