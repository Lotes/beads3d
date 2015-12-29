#include <iostream>
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
	double length() const {
		return sqrt(x*x + y*y + z*z);
	}
	Vector3<double> normalize() const {
		double len = length();
		if(len == 0) {
			Vector3<double> result(0, 0, 0);
			return result;
		} else {
			Vector3<double> result(x/len, y/len, z/len);
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
	csgjs_model toModel() {
		csgjs_model result;
		for(list<Vector3<double>>::iterator it=vertices.begin(); it!=vertices.end(); it++) {
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
	double toDouble(const string& s) {
		istringstream i(s);
		double x;
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
		double x = toDouble(xs);
		double y = toDouble(ys);
		double z = toDouble(zs);
		Vector3<double> v(x, y, z);
		vertices.push_back(v);
	}
	void addFace(const string& as, const string& bs, const string& cs) {
		int a = toInt(as)-1;
		int b = toInt(bs)-1;
		int c = toInt(cs)-1;
		Vector3<int> f(a, b, c);
		faces.push_back(f);
	}
	list<Vector3<double>> vertices;
	list<Vector3<int>> faces;
};

int main() {
	Object obj("../models/pikachu.obj");
	obj.toModel();
	return 0;
}