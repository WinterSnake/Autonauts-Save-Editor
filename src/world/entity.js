// Functions
export function deserializeEntity(entityJson) {
	const entity = {
		name: entityJson['ID'],
		uid: entityJson['UID'],
		despawn: false,
	};
	return entity;
}

export function serializeEntity(entity, x, y) {
	const entityJson = {
		ID: entity.name,
		UID: entity.uid,
		TX: x,
		TY: y
	};
	return entityJson;
}
