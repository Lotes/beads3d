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
		int diffX = max.x - min.x;
		int diffY = max.y - min.y;
		int diffZ = max.z - min.z;
		int maximum = std::max(diffX, std::max(diffY, diffZ));
		if(diffX == maximum) {
		    int middle = (min.x + max.x) / 2;
			left = Range(min, Vector3<int>(middle, max.y, max.z));
			right = Range(Vector3<int>(middle+1, min.y, min.z), max);
		} else if(diffY == maximum) {
			int middle = (min.y + max.y) / 2;
			left = Range(min, Vector3<int>(max.x, middle, max.z));
			right = Range(Vector3<int>(min.x, middle+1, min.z), max);
		} else {
			int middle = (min.z + max.z) / 2;
			left = Range(min, Vector3<int>(max.x, max.y, middle));
			right = Range(Vector3<int>(min.x, min.y, middle+1), max);
		}
		return true;
	}
};

class Object {
public:
	Object(const Object& original): vertices(original.vertices), faces(original.faces) {}
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


static Object cube("cube.obj");
BSPTree createCube(Vector3<float> min, Vector3<float> size) {
	Object obj = cube;
	obj.scale(size);
	obj.translate(min);
	return obj.toTree();
}

void compute(int size, bool* voxels, BSPTree& model, Range& range) {
	Range left;
	Range right;
	bool present;
	
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

int main(int argc, char *argv[]) {
	cube.translate(Vector3<float>(0.5f, 0.5f, 0.5f));
	
	if(argc != 3) {
		cout << "Usage: beadify <file> <size>" << endl;
		return 1;
	}
	
	//config
	int size = atoi(argv[2]);
	char* fileName = argv[1];
	
	//preparation
	Object obj(fileName);
	bool* voxels = (bool*)malloc(size*size*size); 
	memset(voxels, 0, size*size*size);
	obj.normalize();
	BSPTree model = obj.toTree();
	//BSPTree model = createCube(Vector3<float>(0,0,0), Vector3<float>(0.5f, 0.5f, 0.5f));
	
	//computation
	Range range(Vector3<int>(0, 0, 0), Vector3<int>(size-1, size-1, size-1));
	
	clock_t begin = clock();
	compute(size, voxels, model, range);
	clock_t end = clock();
	double elapsed_secs = double(end - begin) / CLOCKS_PER_SEC;
	
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
	
	cout << endl << elapsed_secs << " seconds" << endl;
	
	//clean up
	free(voxels);
	return 0;
}