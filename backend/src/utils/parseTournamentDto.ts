import { TournamentDto } from "../dtos/TournamentDto";

interface RawTournamentDto {
	name?: unknown;
	description?: unknown;
	startDate?: unknown;
	endDate?: unknown;
}

export function parseTournamentDto(raw: RawTournamentDto): TournamentDto {
	if (typeof raw.name !== 'string' ||  raw.name.trim() === ''){
		throw new Error('Field "name" is required and must be a non-empty string');
	}

	let description: string | undefined;
	if (raw.description !== undefined) {
		if (typeof raw.description !== 'string') {
			throw new Error('Field "description", if provided, must be a string');
		}
		description = raw.description;
	}

	if (typeof raw.startDate !== 'string') {
		throw new Error('Field "startDate" required and must be a sting in ISO format');
	}
	const startDate = new Date(raw.startDate);
	if (isNaN(startDate.getTime()))
		throw new Error('Field "startDate" is not a valid date');


	if (typeof raw.endDate !== 'string') {
		throw new Error('Field "endDate" required and must be a sting in ISO format');
	}
	const endDate = new Date(raw.endDate);
	if (isNaN(endDate.getTime()))
		throw new Error('Field "endDate" is not a valid date');

	return { name: raw.name, description, startDate, endDate};
}