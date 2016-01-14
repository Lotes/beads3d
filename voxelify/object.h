#ifndef OBJECT_H
#define OBJECT_H

#include <iostream>
#include <cstring>
#include <string>
#include <boost/regex.hpp>
#include <fstream>
#include <algorithm>
#include <vector>
#include <list>
#include <sstream>
#include <math.h>
#include <ctime>

class Object {
public:
	Object(const Object& original): vertices(original.vertices), faces(original.faces) {}
	Object(const char* fileName) {
		ifstream infile(fileName);
		if(!infile)
			throw "File does not exist!";
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
		for(vector<Vector3<float>>::iterator it=vertices.begin(); it!=vertices.end(); it++)
			box.add(*it);
		return box;
	}
	void normalize() {
		BoundingBox box = bbox();
		Vector3<float> size = box.size();
		float scale = 1.0f / fmaxf(size.x, fmaxf(size.y, size.z));
		for(vector<Vector3<float>>::iterator it=vertices.begin(); it!=vertices.end(); it++) {
			it->x = (it->x - box.min.x) * scale;
			it->y = (it->y - box.min.y) * scale;
			it->z = (it->z - box.min.z) * scale;
		}
	}
	BSPTree toTree() {
		vector<Triangle> triangles;
		for(vector<Vector3<int>>::iterator it=faces.begin(); it!=faces.end(); it++)
			triangles.push_back(Triangle(
				vertices[it->x],
				vertices[it->y],
				vertices[it->z]
			));
		return BSPTree(triangles);
	}
	void translate(Vector3<float> translation) {
		for(vector<Vector3<float>>::iterator it=vertices.begin(); it!=vertices.end(); it++) {
			it->x += translation.x;
			it->y += translation.y;
			it->z += translation.z;
		}
	}
	void scale(Vector3<float> scale) {
		for(vector<Vector3<float>>::iterator it=vertices.begin(); it!=vertices.end(); it++) {
			it->x *= scale.x;
			it->y *= scale.y;
			it->z *= scale.z;
		}
	}
private:
	float toFloat(const string& s) {
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
		float x = toFloat(xs);
		float y = toFloat(ys);
		float z = toFloat(zs);
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
	vector<Vector3<float>> vertices;
	vector<Vector3<int>> faces;
};

#endif