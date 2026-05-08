using ADHD.Domain.Enums;
using System;
using System.Collections.Generic;

namespace ADHD.Domain.Entities
{
    public class Child : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public int Age { get; set; }
        public Gender Gender { get; set; }
        public DiagnosisSeverity DiagnosisSeverity { get; set; }
        public DateTime RegisteredDate { get; set; } = DateTime.UtcNow;
        public ChildStatus Status { get; set; } = ChildStatus.Stable;
        public string AvatarInitials { get; set; } = string.Empty;

        // FK to Doctor and Parent (added via SQL migration)
        public string? DoctorId { get; set; }
        public string? ParentId { get; set; }

        public ICollection<Session> Sessions { get; set; } = new List<Session>();
        public ICollection<ChildProgressSnapshot> ProgressSnapshots { get; set; } = new List<ChildProgressSnapshot>();
    }
}
