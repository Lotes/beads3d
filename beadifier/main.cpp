#include <iostream>
#include <cstring>
#include <string>
#include <boost/regex.hpp>
#include <fstream>
#include <vector>
#include <list>
#include <sstream>
#include <math.h>
#include "csg.h"
 
using namespace std;

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
	Range() : min(0,0,0), max(0,0,0) {}
	Range(Vector3<int> min, Vector3<int> max) : min(min), max(max) {}
	bool isSplittable() {
		return min.x != max.x || min.y != max.y || min.z != max.z;
	}
	bool split(Range& left, Range& right) {
		if(!isSplittable())
			return false;
		if(min.x != max.x) { //x varies
		    int middle = (min.x + max.x) / 2;
			left = Range(min, Vector3<int>(middle, max.y, max.z));
			right = Range(Vector3<int>(middle+1, min.y, min.z), max);
		} else if(min.y != max.y) { //y varies, x is fix
			int middle = (min.y + max.y) / 2;
			left = Range(min, Vector3<int>(max.x, middle, max.z));
			right = Range(Vector3<int>(min.x, middle+1, min.z), max);
		} else { //z varies, x and y are fix
			int middle = (min.z + max.z) / 2;
			left = Range(min, Vector3<int>(max.x, max.y, middle));
			right = Range(Vector3<int>(min.x, min.y, middle+1), max);
		}
		return true;
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
	vector<Vector3<float>> vertices;
	vector<Vector3<int>> faces;
};

/*BSPTree createCube(Vector3<float> min, Vector3<float> size) {
	vector<Triangle> triangles;
	
	Vector3<float> halfSize = size.multiplyScalar(0.5f);
	Vector3<float> normals[] = {
		Vector3<float>(+1, 0, 0),
		Vector3<float>(-1, 0, 0),
		Vector3<float>(0, +1, 0),
		Vector3<float>(0, -1, 0),
		Vector3<float>(0, 0, +1),
		Vector3<float>(0, 0, -1)
	};
	for(int index=0;)
	
	return BSPTree(triangles);
}*/

BSPTree createCube(Vector3<float> min, Vector3<float> size) {
	/*float GAMMA = 0.00001f;
	min = min.add(Vector3<float>(GAMMA, GAMMA, GAMMA));
	size = size.subtract(Vector3<float>(2*GAMMA, 2*GAMMA, 2*GAMMA));*/
	
	vector<Vector3<float>> vertices;
	vector<int> indices;
	vector<Triangle> triangles;
	Vector3<float> max = min.add(size);
	//https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Creating_3D_objects_using_WebGL
	// Front face
	vertices.push_back(Vector3<float>(min.x, min.y, max.z));//  -1.0, -1.0,  1.0,
	vertices.push_back(Vector3<float>(max.x, min.y, max.z));//   1.0, -1.0,  1.0,
	vertices.push_back(Vector3<float>(max.x, max.y, max.z));//   1.0,  1.0,  1.0,
	vertices.push_back(Vector3<float>(min.x, max.y, max.z));//  -1.0,  1.0,  1.0,
	  
	// Back face
	vertices.push_back(Vector3<float>(min.x, min.y, min.z));//  -1.0, -1.0, -1.0,
	vertices.push_back(Vector3<float>(min.x, max.y, min.z));//  -1.0,  1.0, -1.0,
	vertices.push_back(Vector3<float>(max.x, max.y, min.z));//   1.0,  1.0, -1.0,
	vertices.push_back(Vector3<float>(max.x, min.y, min.z));//   1.0, -1.0, -1.0,
	  
	// Top face
	vertices.push_back(Vector3<float>(min.x, max.y, min.z));//  -1.0,  1.0, -1.0,
	vertices.push_back(Vector3<float>(min.x, max.y, max.z));//  -1.0,  1.0,  1.0,
	vertices.push_back(Vector3<float>(max.x, max.y, max.z));//   1.0,  1.0,  1.0,
	vertices.push_back(Vector3<float>(max.x, max.y, min.z));//   1.0,  1.0, -1.0,
	  
	// Bottom face
	vertices.push_back(Vector3<float>(min.x, min.y, min.z));//  -1.0, -1.0, -1.0,
	vertices.push_back(Vector3<float>(max.x, min.y, min.z));//   1.0, -1.0, -1.0,
	vertices.push_back(Vector3<float>(max.x, min.y, max.z));//   1.0, -1.0,  1.0,
	vertices.push_back(Vector3<float>(min.x, min.y, max.z));//  -1.0, -1.0,  1.0,
	  
	// Right face
	vertices.push_back(Vector3<float>(max.x, min.y, min.z));//   1.0, -1.0, -1.0,
	vertices.push_back(Vector3<float>(max.x, max.y, min.z));//   1.0,  1.0, -1.0,
	vertices.push_back(Vector3<float>(max.x, max.y, max.z));//   1.0,  1.0,  1.0,
	vertices.push_back(Vector3<float>(max.x, min.y, max.z));//   1.0, -1.0,  1.0,
	  
	// Left face
	vertices.push_back(Vector3<float>(min.x, min.y, min.z));//  -1.0, -1.0, -1.0,
	vertices.push_back(Vector3<float>(min.x, min.y, max.z));//  -1.0, -1.0,  1.0,
	vertices.push_back(Vector3<float>(min.x, max.y, max.z));//  -1.0,  1.0,  1.0,
	vertices.push_back(Vector3<float>(min.x, max.y, min.z));//  -1.0,  1.0, -1.0
	
	//front
	indices.push_back(0);
	indices.push_back(1);
	indices.push_back(2);
	indices.push_back(0);
	indices.push_back(2);
	indices.push_back(3);

	//back
	indices.push_back(4);
	indices.push_back(5);
	indices.push_back(6);
	indices.push_back(4);
	indices.push_back(6);
	indices.push_back(7);
	
	//top
	indices.push_back(8);
	indices.push_back(9);
	indices.push_back(10);
	indices.push_back(8);
	indices.push_back(10);
	indices.push_back(11);
	
	//bottom
	indices.push_back(12);
	indices.push_back(13);
	indices.push_back(14);
	indices.push_back(12);
	indices.push_back(14);
	indices.push_back(15);
	
	//right
	indices.push_back(16);
	indices.push_back(17);
	indices.push_back(18);
	indices.push_back(16);
	indices.push_back(18);
	indices.push_back(19);
	
	//left
	indices.push_back(20);
	indices.push_back(21);
	indices.push_back(22);
	indices.push_back(20);
	indices.push_back(22);
	indices.push_back(23);
	
	//triangles
	for(int index=0; index<indices.size(); index+=3)
		triangles.push_back(Triangle(vertices[index], vertices[index+1], vertices[index+2]));

	//BSPTree
	return BSPTree(triangles);
}

void compute(int size, bool* voxels, BSPTree& model, Range& range) {
	Range left;
	Range right;
	bool present;
	
	cout << model.toList().size() << endl;
	
	//test intersection
	float scale = 1.0f/size;
	Vector3<float> offset(range.min.x*scale, range.min.y*scale, range.min.z*scale);
	Vector3<float> sizes(
		(range.max.x - range.min.x + 1)*scale,
		(range.max.y - range.min.y + 1)*scale,
		(range.max.z - range.min.z + 1)*scale
	);
	BSPTree cube = createCube(offset, sizes);
	BSPTree intersection = BSPTree::Intersect(model, cube);
	present = !intersection.empty();
	
	if(!present)
		return;
	
	//recursion
	if(range.split(left, right)) {
		compute(size, voxels, intersection, left);
		compute(size, voxels, intersection, right);
	} else {
		int x = range.min.x;
		int y = range.min.y;
		int z = range.min.z;
		int index = x + size * (y + size * z);
		voxels[index] = present;
	}
}

int main() {
	//config
	int size = 10;
	Object obj("../models/pikachu.obj");
	
	//preparation
	bool* voxels = (bool*)malloc(size*size*size); 
	memset(voxels, 0, size*size*size);
	obj.normalize();
	//BSPTree model = obj.toTree();
	BSPTree model = createCube(Vector3<float>(0,0,0), Vector3<float>(0.5f, 0.5f, 0.5f));
	
	//computation
	Range range(Vector3<int>(0, 0, 0), Vector3<int>(size-1, size-1, size-1));
	compute(size, voxels, model, range);
	
	//print
	cout << "[" << endl;
	for(int z=0; z<size; z++) {
		cout << "\t[" << endl;
		for(int y=0; y<size; y++) {
			cout << "\t\t\"";
			for(int x=0; x<size; x++) {
				int index = x + size * (y + size * z);
				cout << (voxels[index] ? "X" : " ");
			}
			cout << "\"";
			if(y<size-1)
				cout << ",";
			cout << endl;
		}
		cout << "\t]";
		if(z<size-1)
			cout << ",";
		cout << endl;
	}
	cout << "]" << endl;
	
	//clean up
	free(voxels);
	return 0;
}