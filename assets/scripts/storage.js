class Storage {

	constructor(scope, storage) {
		this._scope = scope;
		this._storage = storage;
	}

	_scope = 'global';
	_storage = null;

	set(key, value) {
		let id = `${this._scope}.${key}`;
		this._storage[id] = JSON.stringify(value);
	}

	get(key, defaultValue=null) {
		let id = `${this._scope}.${key}`;
		if (id in this._storage)
			return JSON.parse(this._storage[id]);
		return defaultValue;
	}

	delete(key) {
		let id = `${this._scope}.${key}`;
		this._storage.removeItem(id);
	}

}