using ADHD.Application.Responses;
using MediatR;
using System;

namespace ADHD.Application.Commands.SessionCommands
{
    public class CreateSessionCommand : IRequest<Response<string>>
    {
        public string ChildId { get; set; } = string.Empty;
        public string SessionId { get; set; } = string.Empty;
        public DateTime StartTime { get; set; }
        public int DurationMinutes { get; set; }
        public string Therapist { get; set; } = string.Empty;
        public string Game { get; set; } = string.Empty;

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
