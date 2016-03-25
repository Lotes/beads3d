#ifndef VECTOR_H
#define VECTOR_H

#include <string>

using namespace std;

template<class T>
struct Vector3 {
public:
	T x;
	T y;
	T z;
	Vector3(): x(0), y(0), z(0) {}
	Vector3(T x, T y, T z) {
		this->x = x;
		this->y = y;
		this->z = z;
	}
	Vector3<T> multiplyScalar(const T scalar) const {
		return Vector3<T>(x*scalar, y*scalar, z*scalar);
	}
	Vector3<T> multiply(const Vector3<T>& vector) const {
		return Vector3<T>(x*vector.x, y*vector.y, z*vector.z);
	}
	Vector3<T> add(const Vector3<T>& other) const {
		return Vector3<T>(x+other.x, y+other.y, z+other.z);
	}
	Vector3<T> subtract(const Vector3<T>& other) const {
		return Vector3<T>(x-other.x, y-other.y, z-other.z);
	}
	float length() const {
		return (float)sqrt(x*x + y*y + z*z);
	}
  float distanceTo(const Vector3<T>& other) const {
    return subtract(other).length();
  }
	Vector3<float> normalize() const {
		float len = length();
		if(len == 0) {
			Vector3<float> result(0, 0, 0);
			return result;
		} else {
			Vector3<float> result(x/len, y/len, z/len);
			return result;
		}
	}
	Vector3<T> cross(const Vector3<T>& vertex) const {
		return Vector3<T>(
			y * vertex.z - z * vertex.y,
			z * vertex.x - x * vertex.z,
			x * vertex.y - y * vertex.x
		);
	}
	T dot(const Vector3<T>& other) const {
		return x*other.x + y*other.y + z*other.z;
	}
	Vector3<T> lerp(const Vector3<T> a, const T scalar) const {
		return add(a.subtract(*this).multiplyScalar(scalar));
	}
	string toString() {
		std::stringstream stream;
		stream << "[" << x << ", " << y << ", " << z << "]";
		return stream.str();
	}
};

#endif