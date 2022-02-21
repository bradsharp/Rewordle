class Storage {

	constructor(scope, storage) {
		this._scope = scope;
		this._storage = storage;
	}

	_scope = 'global';
	_storage = null;

	set(key, value) {
		console.log(`set: ${key} - ${value}`);
		let id = `${this._scope}.${key}`;
		this._storage[id] = JSON.stringify(value);
	}

	get(key, defaultValue=null) {
		let id = `${this._scope}.${key}`;
		let value = defaultValue;
		if (id in this._storage)
			value = JSON.parse(this._storage[id]);
		console.log(`get: ${key} - ${value} -> ${defaultValue}`);
		return value;
	}

	delete(key) {
		let id = `${this._scope}.${key}`;
		this._storage.removeItem(id);
	}

}