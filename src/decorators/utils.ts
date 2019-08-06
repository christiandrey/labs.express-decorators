import * as glob from "glob";
import * as path from "path";

export const loadTsClassesFromDirectory = (dir: string) => {
	const searchPattern = "/**/*.ts";
	const filesPath = glob.sync(path.normalize(`${dir}${searchPattern}`));
	const files = filesPath.map(o => require(path.resolve(o)));
	const classes = files.map(o => Object.keys(o).map(p => o[p])).reduce((collection, item) => [...collection, ...item], []);
	return classes;
};
