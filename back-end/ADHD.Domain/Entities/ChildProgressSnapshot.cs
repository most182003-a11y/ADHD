namespace ADHD.Domain.Entities
{
    using ADHD.Domain.Enums;
    using System;

    public class ChildProgressSnapshot : BaseEntity
    {
        public string ChildId { get; set; } = string.Empty;
        public Child? Child { get; set; }

        public string GameCategoryId { get; set; } = string.Empty;
        public GameCategory? GameCategory { get; set; }

        /// <summary>Year + month this snapshot covers, e.g. 2025-04-01</summary>
        public DateTime PeriodStart { get; set; }

        public int TotalSessions { get; set; }
        public double AvgPlayerScore { get; set; }
        public double AvgSuccessRate { get; set; }

        // Category-specific averages (null if not applicable)
        public double? AvgImpulsivityIndex { get; set; }
        public double? AvgMotorControlScore { get; set; }
        public double? AvgDistractionScore { get; set; }
        public double? AvgReactionTime { get; set; }

        /// <summary>Overall trend for this child in this category this month.</summary>
        public PerformanceTrend OverallTrend { get; set; }

        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
    }
}
