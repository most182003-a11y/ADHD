using ADHD.Application.Commands.SessionCommands;
using ADHD.Application.Responses;
using ADHD.Domain.Entities;
using ADHD.Domain.Repositories;
using MediatR;
using System.Threading;
using System.Threading.Tasks;

namespace ADHD.Application.Handlers.SessionHandlers
{
    public class SessionCommandHandler : IRequestHandler<CreateSessionCommand, Response<string>>
    {
        private readonly IRepository<Session> _sessionRepository;
        private readonly ResponseHandler _responseHandler;

        public SessionCommandHandler(IRepository<Session> sessionRepository, ResponseHandler responseHandler)
        {
            _sessionRepository = sessionRepository;
            _responseHandler = responseHandler;
        }

        public async Task<Response<string>> Handle(CreateSessionCommand request, CancellationToken cancellationToken)
        {
            var session = new Session
            {
                ChildId = request.ChildId,
                GameId = request.GameId,
                StartTime = request.StartTime,
                DurationMinutes = request.DurationMinutes,
                DifficultyLevel = request.DifficultyLevel,
                TotalTrials = request.TotalTrials,
                SuccessRate = request.SuccessRate,
                PlayerScore = request.PlayerScore,
                ImpulsivityIndex = request.ImpulsivityIndex,
                MotorControlScore = request.MotorControlScore,
                FalseMoves = request.FalseMoves,
                DistractionScore = request.DistractionScore,
                AvgReactionTime = request.AvgReactionTime,
                FalseStops = request.FalseStops,
                MaxConsecutiveSuccess = request.MaxConsecutiveSuccess
            };

            await _sessionRepository.AddAsync(session);
            return _responseHandler.Success("Session recorded successfully");
        }
    }
}
