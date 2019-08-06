import { Request, Response, Express } from "express";
import { loadTsClassesFromDirectory } from "./utils";

const PREFIX_METADATA_KEY = Symbol("prefix");
const ROUTES_METADATA_KEY = Symbol("routes");

export type ControllersType = string | Array<any>;
export type HttpRequestType = "get" | "post" | "put" | "patch" | "delete";

export interface IRouteDefinition {
	path: string;
	action: string;
	requestType: HttpRequestType;
}

const initializeRoutesMetadata = (target: Object) => {
	if (!Reflect.hasMetadata(ROUTES_METADATA_KEY, target)) {
		Reflect.defineMetadata(ROUTES_METADATA_KEY, [], target);
	}
};

const updateRoutesMetadata = (requestType: HttpRequestType, path: string, target: Object, propertyName: string) => {
	initializeRoutesMetadata(target);

	const routes = Reflect.getMetadata(ROUTES_METADATA_KEY, target) as Array<IRouteDefinition>;
	const route = {
		path,
		requestType,
		action: propertyName
	} as IRouteDefinition;

	routes.push(route);

	Reflect.defineMetadata(ROUTES_METADATA_KEY, routes, target);
};

export const RegisterRoutes = (app: Express, controllers: ControllersType = "src/controller") => {
	if (typeof controllers === "undefined" || typeof controllers === "string") {
		controllers = loadTsClassesFromDirectory(controllers);
	}

	controllers.forEach(controller => {
		const instance = new controller();
		const prefix = Reflect.getMetadata(PREFIX_METADATA_KEY, controller) as string;
		const routes = Reflect.getMetadata(ROUTES_METADATA_KEY, controller) as Array<IRouteDefinition>;

		routes.forEach(route => {
			const { path, action, requestType } = route;
			app[requestType](`/${prefix}/${path}`, (req: Request, res: Response, next: Function) => {
				const result = instance[action](req, res, next);
				if (result instanceof Promise) {
					result.then(result => (result !== null && result !== undefined ? res.send(result) : undefined));
				} else if (result !== null && result !== undefined) {
					res.json(result);
				}
			});
		});
	});
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
