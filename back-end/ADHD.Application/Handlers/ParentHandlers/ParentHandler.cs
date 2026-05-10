using ADHD.Application.Commands.ParentCommands;
using ADHD.Application.Queries.ParentQueries;
using ADHD.Application.Responses;
using ADHD.Domain.Entities;
using ADHD.Domain.Repositories;
using MediatR;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace ADHD.Application.Handlers.ParentHandlers
{
    public class ParentCommandHandler : IRequestHandler<CreateParentCommand, Response<string>>
    {
        private readonly IRepository<Parent> _parentRepository;
        private readonly ResponseHandler _responseHandler;

        public ParentCommandHandler(IRepository<Parent> parentRepository, ResponseHandler responseHandler)
        {
            _parentRepository = parentRepository;
            _responseHandler = responseHandler;
        }

        public async Task<Response<string>> Handle(CreateParentCommand request, CancellationToken cancellationToken)
        {
            var parent = new Parent
            {
                UserName = request.Email,
                Email = request.Email,
                PhoneNumber = request.PhoneNumber
                // Note: In a real scenario, you'd use UserManager to handle passwords and other identity features
            };

            await _parentRepository.AddAsync(parent);
            return _responseHandler.Success("Parent created successfully");
        }
    }

    public class ParentQueryHandler : 
        IRequestHandler<GetParentListQuery, Response<IEnumerable<Parent>>>,
        IRequestHandler<GetParentByIdQuery, Response<Parent>>
    {
        private readonly IRepository<Parent> _parentRepository;
        private readonly ResponseHandler _responseHandler;

        public ParentQueryHandler(IRepository<Parent> parentRepository, ResponseHandler responseHandler)
        {
            _parentRepository = parentRepository;
            _responseHandler = responseHandler;
        }

        public async Task<Response<IEnumerable<Parent>>> Handle(GetParentListQuery request, CancellationToken cancellationToken)
        {
            var parents = await _parentRepository.GetAllAsync();
            return _responseHandler.Success(parents);
        }

        public async Task<Response<Parent>> Handle(GetParentByIdQuery request, CancellationToken cancellationToken)
        {
            var parent = await _parentRepository.GetByIdAsync(request.Id);
            return parent != null ? _responseHandler.Success(parent) : _responseHandler.NotFound<Parent>("Parent not found");
        }
    }
}
