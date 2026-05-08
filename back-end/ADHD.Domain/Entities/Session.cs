using ADHD.Domain.Enums;
using System;

namespace ADHD.Domain.Entities
{
    public class Session : BaseEntity
    {
        // ── Relations ──────────────────────────────
        public string ChildId { get; set; } = string.Empty;
        public Child? Child { get; set; }

        public string? GameId { get; set; }
        public Game? Game { get; set; }

        // ── Session Meta ───────────────────────────
        public DateTime StartTime { get; set; }
        public int DurationMinutes { get; set; }

        /// <summary>Auto-incremented per child (1, 2, 3…) for ordered trend charts.</summary>
        public int SessionNumber { get; set; }

        public DifficultyLevel DifficultyLevel { get; set; } = DifficultyLevel.Medium;

        // ── Core Metrics ───────────────────────────
        public int TotalTrials { get; set; }

        /// <summary>Correct responses / total trials × 100</summary>
        public double SuccessRate { get; set; }

        /// <summary>
        /// Normalized composite score 0–100.
        /// Formula (suggested): (SuccessRate × 0.5) + ((1 - ImpulsivityIndex) × 0.3) + (MotorControlScore × 0.2)
        /// Adjust weights per game category.
        /// </summary>
        public double PlayerScore { get; set; }

        // ── ADHD-specific metrics ──────────────────
        /// <summary>Higher = worse impulse control. Range 0–1.</summary>
        public double? ImpulsivityIndex { get; set; }

        /// <summary>Higher = better fine motor control. Range 0–1.</summary>
        public double? MotorControlScore { get; set; }

        /// <summary>Incorrect responses on No-Go / Stop trials.</summary>
        public int? FalseMoves { get; set; }

        // ── Attention-specific metrics ─────────────
        /// <summary>Higher = more distracted. Range 0–1.</summary>
        public double? DistractionScore { get; set; }

        /// <summary>Milliseconds.</summary>
        public double? AvgReactionTime { get; set; }

        /// <summary>Missed targets / omission errors.</summary>
        public int? FalseStops { get; set; }

        // ── Shared performance indicators ──────────
        public int MaxConsecutiveSuccess { get; set; }

        // ── Computed Trend ─────────────────────────
        /// <summary>
        /// Set server-side after saving. Compares this session's PlayerScore
        /// against the previous 4 sessions for this child+game category.
        /// </summary>
        public PerformanceTrend Trend { get; set; } = PerformanceTrend.Insufficient;
    }
}
