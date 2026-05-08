using ADHD.Application.Responses;
using ADHD.Domain.Enums;
using MediatR;
using System;

namespace ADHD.Application.Commands.SessionCommands
{
    public class CreateSessionCommand : IRequest<Response<string>>
    {
        public string ChildId { get; set; } = string.Empty;
        public string? GameId { get; set; }
        public DateTime StartTime { get; set; }
        public int DurationMinutes { get; set; }
        public DifficultyLevel DifficultyLevel { get; set; } = DifficultyLevel.Medium;

        public int TotalTrials { get; set; }
        public double SuccessRate { get; set; }
        public double PlayerScore { get; set; }

        public double? ImpulsivityIndex { get; set; }
        public double? MotorControlScore { get; set; }
        public int? FalseMoves { get; set; }

        public double? DistractionScore { get; set; }
        public double? AvgReactionTime { get; set; }
        public int? FalseStops { get; set; }

        public int MaxConsecutiveSuccess { get; set; }
    }
}
