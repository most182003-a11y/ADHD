using ADHD.Application.Commands.AuthCommands;
using ADHD.Application.Responses;
using ADHD.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Identity;
using System.Threading;
using System.Threading.Tasks;

namespace ADHD.Application.Handlers.AuthHandlers
{
    public class AuthCommandHandler : 
        IRequestHandler<RegisterUserCommand, Response<string>>,
        IRequestHandler<LoginCommand, Response<string>>
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly SignInManager<AppUser> _signInManager;
        private readonly ResponseHandler _responseHandler;

        public AuthCommandHandler(UserManager<AppUser> userManager, SignInManager<AppUser> signInManager, ResponseHandler responseHandler)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _responseHandler = responseHandler;
        }

        public async Task<Response<string>> Handle(RegisterUserCommand request, CancellationToken cancellationToken)
        {
            var user = new AppUser
            {
                UserName = request.UserName,
                Email = request.Email
            };

            var result = await _userManager.CreateAsync(user, request.Password);

            if (!result.Succeeded)
            {
                return new Response<string>("Registration failed", false)
                {
                    Errors = result.Errors.Select(e => e.Description).ToList()
                };
            }

            return _responseHandler.Success("User registered successfully");
        }

        public async Task<Response<string>> Handle(LoginCommand request, CancellationToken cancellationToken)
        {
            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null)
            {
                return _responseHandler.BadRequest<string>("Invalid email or password");
            }

            var result = await _signInManager.PasswordSignInAsync(user, request.Password, false, false);

            if (!result.Succeeded)
            {
                return _responseHandler.BadRequest<string>("Invalid email or password");
            }

            // For now, returning a simple success message. 
            // In a real scenario, you'd return a JWT token here.
            return _responseHandler.Success("Login successful");
        }
    }
}
