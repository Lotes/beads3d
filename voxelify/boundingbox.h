#ifndef BOUNDING_BOX_H
#define BOUNDING_BOX_H

#include <math.h>
#include "vector.h"
#include "vertex.h"

struct BoundingBox {
	Vector3<float> min;
	Vector3<float> max;
	
	BoundingBox() {
		min.x = min.y = min.z = +INFINITY;
		max.x = max.y = max.z = -INFINITY;
	}
	
	void add(Vector3<float>& other) {
		min.x = fminf(min.x, other.x);
		min.y = fminf(min.y, other.y);
		min.z = fminf(min.z, other.z);
		max.x = fmaxf(max.x, other.x);
		max.y = fmaxf(max.y, other.y);
		max.z = fmaxf(max.z, other.z);
	}
	
  void add(Vertex& other) {
		min.x = fminf(min.x, other.x);
		min.y = fminf(min.y, other.y);
		min.z = fminf(min.z, other.z);
		max.x = fmaxf(max.x, other.x);
		max.y = fmaxf(max.y, other.y);
		max.z = fmaxf(max.z, other.z);
	}
  
	Vector3<float> size() const {
		return max.subtract(min);
	}
};

#endif