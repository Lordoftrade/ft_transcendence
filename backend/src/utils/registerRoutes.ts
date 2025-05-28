import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { AuthController } from "../api/controllers/AuthController";
import { UserController } from "../api/controllers/UserController";
import { MatchmakingController } from "../api/controllers/MatchmakingController";
import { MatchController } from "../api/controllers/MatchController";
import { TournamentController } from "../api/controllers/TournamentController";
// import { TournamentMatchController } from "../api/controllers/TournamentMatchController";
import { TournamentParticipantController } from "../api/controllers/TournamentParticipantController";
import { BlockController } from "../api/controllers/BlockController";
import { ChatController } from "../api/controllers/ChatController";
import { InvitationController } from "../api/controllers/InvitationController";
import { MatchWebSocketController } from "../api/controllers/MatchWebcosketController";
import { MatchWebSocketService } from "../services/MatchWebsocketService";

type ControllerConstructor = new (app: FastifyInstance) => any;

export function registerRoutes(fastify: FastifyInstance) {

	//test route
	fastify.get('/ping', async (request, reply) => {
		return { status: 'ok', message: 'Pong!' };
	});

	registerSecure(fastify, '/auth', AuthController, 'registerSecureRoutes');
	registerSecure(fastify, '/user', UserController, 'registerRoutes');
	registerSecure(fastify, '/matchmaking', MatchmakingController, 'registerProtectedRoutes');
	registerSecure(fastify, '/match', MatchController, 'registerRoutes');
	registerSecure(fastify, '/tournament', TournamentController, 'registerSecureRoutes');
	// registerSecure(fastify, '/tournament', TournamentMatchController, 'registerSecureRoutes');
	registerSecure(fastify, '/tournament', TournamentParticipantController, 'registerSecureRoutes');
	registerSecure(fastify, '/block', BlockController, 'registerSecureRoutes');
	registerSecure(fastify, '/chat', ChatController, 'registerSecureRoutes');
	registerSecure(fastify, '/invitation', InvitationController, 'registerSecureRoutes');

	// public: /matchmaking/process
	fastify.register(async (app) => {
		const authCtrl = new AuthController(app);
		authCtrl.registerRoutes();
	}, { prefix: '/auth' });

	fastify.register(async (app) => {
		const mmCtrl = new MatchmakingController(app);
		mmCtrl.registerPublicRoutes();
	}, { prefix: '/matchmaking' });

	fastify.register(async (app) => {
		const mmCtrl = new TournamentController(app);
		mmCtrl.registerRoutes();
	}, { prefix: '/tournament' });

	// fastify.register(async (app) => {
	// 	const mmCtrl = new TournamentMatchController(app);
	// 	mmCtrl.registerRoutes();
	// }, { prefix: '/tournament' });

	fastify.register(async (app) => {
		const mmCtrl = new TournamentParticipantController(app);
		mmCtrl.registerRoutes();
	}, { prefix: '/tournamentParticipant' });

	const matchWebSocketController = new MatchWebSocketController(
		fastify);
	matchWebSocketController.registerRoutes(new MatchWebSocketService());
}

function registerSecure(
	fastify: FastifyInstance,
  	prefix: string,
  	controllerCtor: ControllerConstructor,
  	methodName: keyof InstanceType<typeof controllerCtor>) 
{
  fastify.register(async (app) => {
    // общий preHandler
	app.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
		try {
			await request.jwtVerify();
		}
		catch (err){
			reply.status(401).send({message: 'Unauthorized'});
		}
	});
    new controllerCtor(app)[methodName]();
  }, { prefix });
}