using ADHD.Application.Queries.SessionQueries;
using ADHD.Application.Responses;
using ADHD.Domain.Entities;
using ADHD.Domain.Repositories;
using MediatR;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ADHD.Application.Handlers.SessionHandlers
{
    public class SessionQueryHandler : IRequestHandler<GetSessionListQuery, Response<IEnumerable<Session>>>
    {
        private readonly IRepository<Session> _sessionRepository;
        private readonly ResponseHandler _responseHandler;

        public SessionQueryHandler(IRepository<Session> sessionRepository, ResponseHandler responseHandler)
        {
            _sessionRepository = sessionRepository;
            _responseHandler = responseHandler;
        }

        public async Task<Response<IEnumerable<Session>>> Handle(GetSessionListQuery request, CancellationToken cancellationToken)
        {
            IEnumerable<Session> sessions;
            if (!string.IsNullOrEmpty(request.ChildId))
            {
                sessions = await _sessionRepository.FindAsync(s => s.ChildId == request.ChildId);
            }
            else
            {
                sessions = await _sessionRepository.GetAllAsync();
            }
            
            return _responseHandler.Success(sessions);
        }
    }
}
