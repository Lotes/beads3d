#include <iostream>
#include <cstring>
#include <string>
#include <boost/regex.hpp>
#include <fstream>
#include <list>
#include <sstream>
#include <math.h>
#include "csgjs.h"
 
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
		Vector3<T> result(x*scalar, y*scalar, z*scalar);
		return result;
	}
	Vector3<T> add(const Vector3<T>& other) const {
		Vector3<T> result(x+other.x, y+other.y, z+other.z);
		return result;
	}
	Vector3<T> subtract(const Vector3<T>& other) const {
		Vector3<T> result(x-other.x, y-other.y, z-other.z);
		return result;
	}
	float length() const {
		return sqrt(x*x + y*y + z*z);
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
		Vector3<T> result(
			y * vertex.z - z * vertex.y,
			z * vertex.x - x * vertex.z,
			x * vertex.y - y * vertex.x
		);
		return result;
	}
	T dot(const Vector3<T>& other) const {
		return x*other.x + y*other.y + z*other.z;
	}
	Vector3<T> lerp(const Vector3<T> a, const T scalar) const {
		return add(a.subtract(*this).multiplyScalar(scalar));
	}
};

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
	
	Vector3<float> size() const {
		return max.subtract(min);
	}
};

struct Range {
	Vector3<int> min;
	Vector3<int> max;
	Range(Vector3<int> min, Vector3<int> max) : min(min), max(max) {}
};

class Object {
public:
	Object(const char* fileName) {
		ifstream infile(fileName);
		string line;
		while (getline(infile, line)) {
			boost::regex vertexPattern(".*v +([\\d|\\.|\\+|\\-|e|E]+) +([\\d|\\.|\\+|\\-|e|E]+) +([\\d|\\.|\\+|\\-|e|E]+).*");
			boost::regex facePattern1(".*f +(\\d+) +(\\d+) +(\\d+).*");
			boost::regex facePattern2(".*f +(\\d+)/\\d+ +(\\d+)/\\d+ +(\\d+)/\\d+.*");
			boost::regex facePattern3(".*f +(\\d+)/\\d+/\\d+ +(\\d+)/\\d+/\\d+ +(\\d+)/\\d+/\\d+.*");
			boost::regex facePattern4(".*f +(\\d+)//\\d+ +(\\d+)//\\d+ +(\\d+)//\\d+.*");
			boost::match_results<std::string::const_iterator> match;
			if(boost::regex_match(line, match, vertexPattern)) {
				addVertex(match[1].str(), match[2].str(), match[3].str());
			} 
			else if(boost::regex_match(line, match, facePattern1)) {
				addFace(match[1].str(), match[2].str(), match[3].str());
			}
			else if(boost::regex_match(line, match, facePattern2)) {
				addFace(match[1].str(), match[2].str(), match[3].str());
			}
			else if(boost::regex_match(line, match, facePattern3)) {
				addFace(match[1].str(), match[2].str(), match[3].str());
			}
			else if(boost::regex_match(line, match, facePattern4)) {
				addFace(match[1].str(), match[2].str(), match[3].str());
			}
		}
	}
	BoundingBox bbox() {
		BoundingBox box;
		for(list<Vector3<float>>::iterator it=vertices.begin(); it!=vertices.end(); it++)
			box.add(*it);
		return box;
	}
	void normalize() {
		BoundingBox box = bbox();
		Vector3<float> size = box.size();
		float scale = 1.0f / fmaxf(size.x, fmaxf(size.y, size.z));
		for(list<Vector3<float>>::iterator it=vertices.begin(); it!=vertices.end(); it++) {
			it->x = (it->x - box.min.x) * scale;
			it->y = (it->y - box.min.y) * scale;
			it->z = (it->z - box.min.z) * scale;
		}
	}
	csgjs_model toModel() {
		csgjs_model result;
		for(list<Vector3<float>>::iterator it=vertices.begin(); it!=vertices.end(); it++) {
			csgjs_vertex vertex;
			csgjs_vector position(it->x, it->y, it->z);
			vertex.pos = position;
			result.vertices.push_back(vertex);
		}
		for(list<Vector3<int>>::iterator it=faces.begin(); it!=faces.end(); it++) {
			result.indices.push_back(it->x);
			result.indices.push_back(it->y);
			result.indices.push_back(it->z);
		}
		return result;
	}
private:
	float tofloat(const string& s) {
		istringstream i(s);
		float x;
		if (!(i >> x))
			return 0;
		return x;
	}
	int toInt(const string& s) {
		istringstream i(s);
		int x;
		if (!(i >> x))
			return 0;
		return x;
	}
	void addVertex(const string& xs, const string& ys, const string& zs) {
		float x = tofloat(xs);
		float y = tofloat(ys);
		float z = tofloat(zs);
		Vector3<float> v(x, y, z);
		vertices.push_back(v);
	}
	void addFace(const string& as, const string& bs, const string& cs) {
		int a = toInt(as)-1;
		int b = toInt(bs)-1;
		int c = toInt(cs)-1;
		Vector3<int> f(a, b, c);
		faces.push_back(f);
	}
	list<Vector3<float>> vertices;
	list<Vector3<int>> faces;
};

void compute(int maxSize, bool* voxels, csgjs_model& model, Range& range) {
	
}

csgjs_vertex createVertex(float x, float y, float z)  {
	csgjs_vertex result;
	result.pos.x = x;
	result.pos.y = y;
	result.pos.z = z;
	return result;
}

csgjs_model createCube(Vector3<float> min, Vector3<float> size) {
	csgjs_model cube;
	Vector3<float> max = min.add(size);
	//https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Creating_3D_objects_using_WebGL
	// Front face
	cube.vertices.push_back(createVertex(min.x, min.y, max.z));//  -1.0, -1.0,  1.0,
	cube.vertices.push_back(createVertex(max.x, min.y, max.z));//   1.0, -1.0,  1.0,
	cube.vertices.push_back(createVertex(max.x, max.y, max.z));//   1.0,  1.0,  1.0,
	cube.vertices.push_back(createVertex(min.x, max.y, max.z));//  -1.0,  1.0,  1.0,
	  
	// Back face
	cube.vertices.push_back(createVertex(min.x, min.y, min.z));//  -1.0, -1.0, -1.0,
	cube.vertices.push_back(createVertex(min.x, max.y, min.z));//  -1.0,  1.0, -1.0,
	cube.vertices.push_back(createVertex(max.x, max.y, min.z));//   1.0,  1.0, -1.0,
	cube.vertices.push_back(createVertex(max.x, min.y, min.z));//   1.0, -1.0, -1.0,
	  
	// Top face
	cube.vertices.push_back(createVertex(min.x, max.y, min.z));//  -1.0,  1.0, -1.0,
	cube.vertices.push_back(createVertex(min.x, max.y, max.z));//  -1.0,  1.0,  1.0,
	cube.vertices.push_back(createVertex(max.x, max.y, max.z));//   1.0,  1.0,  1.0,
	cube.vertices.push_back(createVertex(max.x, max.y, min.z));//   1.0,  1.0, -1.0,
	  
	// Bottom face
	cube.vertices.push_back(createVertex(min.x, min.y, min.z));//  -1.0, -1.0, -1.0,
	cube.vertices.push_back(createVertex(max.x, min.y, min.z));//   1.0, -1.0, -1.0,
	cube.vertices.push_back(createVertex(max.x, min.y, max.z));//   1.0, -1.0,  1.0,
	cube.vertices.push_back(createVertex(min.x, min.y, max.z));//  -1.0, -1.0,  1.0,
	  
	// Right face
	cube.vertices.push_back(createVertex(max.x, min.y, min.z));//   1.0, -1.0, -1.0,
	cube.vertices.push_back(createVertex(max.x, max.y, min.z));//   1.0,  1.0, -1.0,
	cube.vertices.push_back(createVertex(max.x, max.y, max.z));//   1.0,  1.0,  1.0,
	cube.vertices.push_back(createVertex(max.x, min.y, max.z));//   1.0, -1.0,  1.0,
	  
	// Left face
	cube.vertices.push_back(createVertex(min.x, min.y, min.z));//  -1.0, -1.0, -1.0,
	cube.vertices.push_back(createVertex(min.x, min.y, max.z));//  -1.0, -1.0,  1.0,
	cube.vertices.push_back(createVertex(min.x, max.y, max.z));//  -1.0,  1.0,  1.0,
	cube.vertices.push_back(createVertex(min.x, max.y, min.z));//  -1.0,  1.0, -1.0
	
	//front
	cube.indices.push_back(0);
	cube.indices.push_back(1);
	cube.indices.push_back(2);
	cube.indices.push_back(0);
	cube.indices.push_back(2);
	cube.indices.push_back(3);

	//back
	cube.indices.push_back(4);
	cube.indices.push_back(5);
	cube.indices.push_back(6);
	cube.indices.push_back(4);
	cube.indices.push_back(6);
	cube.indices.push_back(7);
	
	//top
	cube.indices.push_back(8);
	cube.indices.push_back(9);
	cube.indices.push_back(10);
	cube.indices.push_back(8);
	cube.indices.push_back(10);
	cube.indices.push_back(11);
	
	//bottom
	cube.indices.push_back(12);
	cube.indices.push_back(13);
	cube.indices.push_back(14);
	cube.indices.push_back(12);
	cube.indices.push_back(14);
	cube.indices.push_back(15);
	
	//right
	cube.indices.push_back(16);
	cube.indices.push_back(17);
	cube.indices.push_back(18);
	cube.indices.push_back(16);
	cube.indices.push_back(18);
	cube.indices.push_back(19);
	
	//left
	cube.indices.push_back(20);
	cube.indices.push_back(21);
	cube.indices.push_back(22);
	cube.indices.push_back(20);
	cube.indices.push_back(22);
	cube.indices.push_back(23);
	
	return cube;
}

int main() {
	//config
	int size = 20;
	Object obj("../models/pikachu.obj");
	
	//preparation
	bool* voxels = new bool[size*size*size]; 
	memset(voxels, 0, size*size*size);
	obj.normalize();
	csgjs_model model = obj.toModel();
	
	//computation
	Range range(Vector3<int>(0, 0, 0), Vector3<int>(size-1, size-1, size-1));
	compute(size, voxels, model, range);
	
	//clean up
	delete[] voxels;
	return 0;
}