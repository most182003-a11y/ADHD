using ADHD.Application.Commands.SessionCommands;
using ADHD.Application.Queries.SessionQueries;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace ADHD.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SessionsController : ControllerBase
    {
        private readonly IMediator _mediator;

        public SessionsController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpPost]
        public async Task<IActionResult> CreateSession([FromBody] CreateSessionCommand command)
        {
            var result = await _mediator.Send(command);
            return result.Succeeded == true ? Ok(result) : BadRequest(result);
        }

        [HttpGet]
        public async Task<IActionResult> GetAllSessions([FromQuery] string? childId)
        {
            var query = new GetSessionListQuery { ChildId = childId };
            var result = await _mediator.Send(query);
            return result.Succeeded == true ? Ok(result) : BadRequest(result);
        }
    }
}
