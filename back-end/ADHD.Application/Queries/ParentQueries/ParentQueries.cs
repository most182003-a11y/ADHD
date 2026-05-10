using ADHD.Application.Responses;
using ADHD.Domain.Entities;
using MediatR;
using System.Collections.Generic;

namespace ADHD.Application.Queries.ParentQueries
{
    public class GetParentListQuery : IRequest<Response<IEnumerable<Parent>>>
    {
    }

    public class GetParentByIdQuery : IRequest<Response<Parent>>
    {
        public string Id { get; set; } = string.Empty;
    }
}
