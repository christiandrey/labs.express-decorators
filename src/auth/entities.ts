import { PrimaryGeneratedColumn, Column } from "typeorm";

export abstract class ElfUser {
	@PrimaryGeneratedColumn("uuid")
	id: string;
	@Column({ nullable: true })
	username: string;
	@Column({ unique: true })
	email: string;
	@Column({ default: false })
	emailVerified: boolean;
	@Column({ nullable: false })
	passwordHash: string;

	/**
	 *
	 */
	constructor(dto: Partial<ElfUser> = {}) {
		this.id = dto.id;
		this.username = dto.username;
		this.email = dto.email;
		this.emailVerified = dto.emailVerified;
		this.passwordHash = dto.passwordHash;
	}
}

export abstract class ElfRole {
	@Column({ nullable: false })
	name: string;

	/**
	 *
	 */
	constructor(dto: Partial<ElfRole> = {}) {
		this.name = dto.name;
	}
}

export interface IJwtPayloadUserDetails {
	givenName: string;
	familyName: string;
}

export class JwtPayload {
	sub: string;
	authTime: number;
	email: string;
	givenName: string;
	familyName: string;
	emailVerified: boolean;
	role: string;

	/**
	 *
	 */
	constructor(dto: Partial<JwtPayload> = {}) {
		this.sub = dto.sub;
		this.authTime = dto.authTime;
		this.email = dto.email;
		this.givenName = dto.givenName;
		this.familyName = dto.familyName;
		this.emailVerified = dto.emailVerified;
		this.role = dto.role;
	}
}

export class TokenResponse {
	token: string;
	expiresIn: number;
	tokenType: string;

	/**
	 *
	 */
	constructor(token: string, expiresIn = 7 * 24 * 60 * 60) {
		this.token = token;
		this.expiresIn = expiresIn;
		this.tokenType = "Bearer";
	}
}
