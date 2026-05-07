using System;

namespace ADHD.Domain.Entities
{
    public class Session : BaseEntity
    {
        public string ChildId { get; set; } = string.Empty;
        public Child? Child { get; set; }

        public string SessionId { get; set; } = string.Empty;
        public DateTime StartTime { get; set; }
        public int DurationMinutes { get; set; }
        public string Therapist { get; set; } = string.Empty;
        public string Game { get; set; } = string.Empty;

        // Summary Fields
        public int TotalTrials { get; set; }
        public double SuccessRate { get; set; }
        public double ImpulsivityIndex { get; set; }
        public double MotorControlScore { get; set; }
        public double DistractionScore { get; set; }
        public double AvgReactionTime { get; set; }
        public int MaxConsecutiveSuccess { get; set; }
        public int? FalseMoves { get; set; }
        public int? FalseStops { get; set; }
        public int? RedPhaseErrors { get; set; }
        public int? GreenPhaseErrors { get; set; }
    }
}
