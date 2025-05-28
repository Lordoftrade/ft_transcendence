import Fastify from 'fastify';
import {TypeBoxTypeProvider} from '@fastify/type-provider-typebox';
import fs from 'fs';
import path from 'path';
import fastifyCookie from '@fastify/cookie';
import fastifyJwt from '@fastify/jwt';
import fastifyMultipart from '@fastify/multipart';
import { MatchmakingService } from './services/MatchmakingService';
import { registerRoutes } from './utils/registerRoutes';
import fastifyCors from '@fastify/cors';
import fastifyStatic from '@fastify/static'; 
import {fastifyWebsocket} from '@fastify/websocket';
import {TournamentService} from './services/TournamentService';
import { TournamentMatchService } from './services/TournamentMatchService';
import { SystemUserService } from './services/SystemUserService';

// server init
const fastify = Fastify(
	{
		logger: true,
		https: 
		{
			key: fs.readFileSync(path.join(__dirname, '../certs/key.pem')),
			cert: fs.readFileSync(path.join(__dirname, '../certs/cert.pem'))
		}
	}
).withTypeProvider<TypeBoxTypeProvider>();

fastify.addHook('onSend', async (request, reply, payload) => {
  // позволим попапам Google закрывать себя
  reply.header('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  return payload;
});

fastify.register(fastifyCors, {
	origin: true,
	credentials: true,
	methods: ['GET', 'POST', 'DELETE', 'OPTIONS', 'PUT']
});



fastify.register(fastifyCookie);

fastify.register(fastifyJwt, {
	secret: process.env.ACCESS_TOKEN_SECRET || 'superSecretKey'
});

fastify.register(fastifyMultipart);

fastify.register(require('@fastify/websocket'));
registerRoutes(fastify);

fastify.register(fastifyStatic, {
  root: path.join(__dirname, '../data'),
  prefix: '/img/',
  decorateReply: true,       // по умолчанию
});

fastify.register(fastifyStatic, {
  root: path.join(__dirname, '../uploads'),
  prefix: '/uploads/',
  decorateReply: false,
});

// Добавьте перед запуском сервера
const initSystemUser = async () => {
  try {
    const systemUserService = new SystemUserService();
    await systemUserService.ensureSystemUserExists();
    console.log('System user initialized successfully');
  } catch (error) {
    console.error('Failed to initialize system user:', error);
  }
};

// Инициализируем системного пользователя перед запуском сервера
fastify.addHook('onReady', async () => {
  await initSystemUser();
});

// Запуск сервера
fastify.listen({ port: 3000, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  fastify.log.info(`Server starts at ${address}`);
});

const mmService = new MatchmakingService();
setInterval(() => mmService.processQueue().catch(console.error), 1000);

const tournamentService = new TournamentService();
// const tournamentMatchService = new TournamentMatchService();

setInterval(async () => {
	try {
		const readyTournaments = await tournamentService.chechAndUpdateTournamentStatus();

		if (readyTournaments.length > 0) {
			console.log(`${readyTournaments.length} tournaments ready to start`);
		}
	} catch (err) {
		console.error('Error checking tournaments:', err);
	}
}, 5000); // every minute

// setInterval(async () => {
// 	try {
// 		const activeTournaments = await tournamentService.getActiveTournaments();

// 		for (const tournament of activeTournaments) {
// 			await tournamentMatchService.checkAndStartNextRoundMatches(tournament.id);
// 			await tournamentMatchService.checkDisconnectedPlayers(tournament.id);
// 		}
// 	} catch (err) {
// 		console.error('Error in tournament progress check:', err);
// 	}
// }, 30000); // every 30 seconds
