import { AuthorizeUser, AuthorizeUserRoles, AuthorizeUsers } from "../auth";
import { Request, Response, Express } from "express";
import { loadTsClassesFromDirectory } from "./utils";
import passport = require("passport");
import { HttpResponse, HttpStatusCodes, ApiResponse, ApiResponseError } from "../utils";

const PREFIX_METADATA_KEY = Symbol("prefix");
const ROUTES_METADATA_KEY = Symbol("routes");

export type ControllersType = string | Array<any>;
export type HttpRequestType = "get" | "post" | "put" | "patch" | "delete";

export interface IRouteDefinition {
	path: string;
	action: string;
	requestType: HttpRequestType;
	authorize: boolean;
	allowAnonymous: boolean;
	users?: Array<string>;
	roles?: Array<string>;
}

interface IAuthorizeOptions {
	users?: Array<string>;
	roles?: Array<string>;
}

const initializeRoutesMetadata = (target: Object) => {
	if (!Reflect.hasMetadata(ROUTES_METADATA_KEY, target)) {
		Reflect.defineMetadata(ROUTES_METADATA_KEY, [], target);
	}
};

const updateRoutesMetadata = (requestType: HttpRequestType, path: string, target: Object, propertyName: string) => {
	initializeRoutesMetadata(target);

	const routes = Reflect.getMetadata(ROUTES_METADATA_KEY, target) as Array<IRouteDefinition>;
	const index = routes.findIndex(o => o.action === propertyName);
	const payload = {
		path,
		requestType,
		action: propertyName
	} as IRouteDefinition;

	if (index < 0) {
		routes.push(payload);
	} else {
		routes[index] = Object.assign(routes[index], payload);
	}

	Reflect.defineMetadata(ROUTES_METADATA_KEY, routes, target);
};

export const RegisterRoutes = (app: Express, resolveController?: (controller: any) => any, controllers: ControllersType = "src/controller") => {
	if (typeof controllers === "undefined" || typeof controllers === "string") {
		controllers = loadTsClassesFromDirectory(controllers);
	}

	controllers.forEach(controller => {
		const instance = !!resolveController ? resolveController(controller) : new controller();
		const prefix = Reflect.getMetadata(PREFIX_METADATA_KEY, controller) as string;
		const routes = Reflect.getMetadata(ROUTES_METADATA_KEY, controller) as Array<IRouteDefinition>;

		routes.forEach(route => {
			const { path, action, requestType, authorize, allowAnonymous, roles, users } = route;
			const shouldAuthorize = !(!!allowAnonymous || !authorize);

			if (shouldAuthorize) {
				app[requestType](`/${prefix}/${path}`, AuthorizeUser, async (req: Request, res: Response, next: Function) => {
					try {
						AuthorizeUserRoles(req, roles);
						AuthorizeUsers(req, users);
					} catch (error) {
						res.status(HttpStatusCodes.unauthorized).send();
						return;
					}

					const result: HttpResponse = await instance[action](req, res, next);
					res.status(result.code).json(result.data);
				});
			} else {
				app[requestType](`/${prefix}/${path}`, async (req: Request, res: Response, next: Function) => {
					const result: HttpResponse = await instance[action](req, res, next);
					res.status(result.code).json(result.data);
				});
			}
		});
	});
};

export const AuthorizeRoutes = (options?: IAuthorizeOptions): ClassDecorator => {
	return (target: Object) => {
		initializeRoutesMetadata(target);

		let routes = Reflect.getMetadata(ROUTES_METADATA_KEY, target) as Array<IRouteDefinition>;
		routes = routes.map(o => ({ ...o, authorize: true }));

		Reflect.defineMetadata(ROUTES_METADATA_KEY, routes, target);
	};
};

export const Authorize = (options?: IAuthorizeOptions): MethodDecorator => {
	return (target: Object, propertyName: string, propertyDescriptor: PropertyDescriptor) => {
		initializeRoutesMetadata(target.constructor);

		const routes = Reflect.getMetadata(ROUTES_METADATA_KEY, target.constructor) as Array<IRouteDefinition>;
		const index = routes.findIndex(o => o.action === propertyName);
		const payload = {
			action: propertyName,
			authorize: true
		} as IRouteDefinition;

		if (index < 0) {
			routes.push(payload);
		} else {
			routes[index] = Object.assign(routes[index], payload);
		}

		Reflect.defineMetadata(ROUTES_METADATA_KEY, routes, target.constructor);
	};
};

export const AllowAnonymous = (): MethodDecorator => {
	return (target: Object, propertyName: string, propertyDescriptor: PropertyDescriptor) => {
		initializeRoutesMetadata(target.constructor);

		const routes = Reflect.getMetadata(ROUTES_METADATA_KEY, target.constructor) as Array<IRouteDefinition>;
		const index = routes.findIndex(o => o.action === propertyName);
		const payload = {
			action: propertyName,
			allowAnonymous: true
		} as IRouteDefinition;

		if (index < 0) {
			routes.push(payload);
		} else {
			routes[index] = Object.assign(routes[index], payload);
		}

		Reflect.defineMetadata(ROUTES_METADATA_KEY, routes, target.constructor);
	};
};

export const Controller = (prefix: string = ""): ClassDecorator => {
	return (target: Object) => {
		Reflect.defineMetadata(PREFIX_METADATA_KEY, prefix, target);

		// ----------------------------------------------------------------
		// REGISTER ROUTES METADATA FOR CONTROLLER IF IT DOES NOT EXIST
		// ----------------------------------------------------------------
		initializeRoutesMetadata(target);
	};
};

export const HttpGet = (path: string): MethodDecorator => {
	return (target: Object, propertyName: string, propertyDescriptor: PropertyDescriptor) => {
		updateRoutesMetadata("get", path, target.constructor, propertyName);
	};
};

export const HttpPost = (path: string): MethodDecorator => {
	return (target: Object, propertyName: string, propertyDescriptor: PropertyDescriptor) => {
		updateRoutesMetadata("post", path, target.constructor, propertyName);
	};
};

export const HttpPut = (path: string): MethodDecorator => {
	return (target: Object, propertyName: string, propertyDescriptor: PropertyDescriptor) => {
		updateRoutesMetadata("put", path, target.constructor, propertyName);
	};
};

export const HttpPatch = (path: string): MethodDecorator => {
	return (target: Object, propertyName: string, propertyDescriptor: PropertyDescriptor) => {
		updateRoutesMetadata("patch", path, target.constructor, propertyName);
	};
};

export const HttpDelete = (path: string): MethodDecorator => {
	return (target: Object, propertyName: string, propertyDescriptor: PropertyDescriptor) => {
		updateRoutesMetadata("delete", path, target.constructor, propertyName);
	};
};

export const Logger = (): MethodDecorator => {
	return (target: Object, propertyName: string, propertyDescriptor: PropertyDescriptor) => {
		const original = propertyDescriptor.value;

		const modified = async function(...args: any[]) {
			try {
				const base = await original.apply(this, args);
				return base;
			} catch (error) {
				return new HttpResponse(
					new ApiResponse({
						errors: [
							new ApiResponseError({
								message: "An unexpected error occured. Please try again in a few minutes."
							})
						]
					}),
					HttpStatusCodes.internalServerError
				);
			}
		};

		propertyDescriptor.value = modified;

		return propertyDescriptor;
	};
};
