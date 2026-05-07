using ADHD.Application.Responses;
using ADHD.Domain.Entities;
using MediatR;
using System.Collections.Generic;

namespace ADHD.Application.Queries.SessionQueries
{
    public class GetSessionListQuery : IRequest<Response<IEnumerable<Session>>>
    {
        public string? ChildId { get; set; }
    }
}
