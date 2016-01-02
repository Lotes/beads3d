#ifndef CSG_H
#define CSG_H

#include <vector>
#include <math.h>
#include <utility>
#include <sstream>
#include <fstream>
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

enum {
	COPLANAR = 0,
	FRONT = 1,
	BACK = 2,
	SPANNING = 3
};

const float EPSILON = 0.000001f;

class Triangle {
public:
	Triangle(): _w(0) {}

	Triangle(Vector3<float> a, Vector3<float> b, Vector3<float> c) {
		_vertices[0] = a;
		_vertices[1] = b;
		_vertices[2] = c;
		_normal = b.subtract(a).cross(c.subtract(a)).normalize();
		_w = _normal.dot(a);
	}
	
	const Vector3<float>* vertices() const { return &_vertices[0]; }
	const Vector3<float>& normal() const { return _normal; }
	float w() const { return _w; }
	bool ok() const { return _normal.length() > 0; }
	
	void flip() {
		swap(_vertices[0], _vertices[2]);
		_normal = _normal.multiplyScalar(-1);
		_w *= -1;
	}
	
	string toString() {
		std::stringstream stream;
		stream << "[" << _vertices[0].toString() << ", " << _vertices[1].toString() << ", " << _vertices[2].toString() << "]";
		return stream.str();
	}
	
	void split(const Triangle& polygon, vector<Triangle>& coFront, vector<Triangle>& coBack, vector<Triangle>& front, vector<Triangle>& back) const {
		int typeMask = 0;
		int types[3];
		for(int index=0; index<3; index++)
			typeMask |= types[index] = classify(polygon._vertices[index]);
		switch(typeMask) {
			case COPLANAR:
				if(_normal.dot(polygon._normal) > 0)
					coFront.push_back(polygon);
				else
					coBack.push_back(polygon);
				break;
			case FRONT:
				front.push_back(polygon);
				break;
			case BACK:
				back.push_back(polygon);
				break;
			case SPANNING:
				vector<Vector3<float>> f, b;
				for (size_t i = 0; i < 3; i++) 
				{
					int j = (i + 1) % 3;
					int ti = types[i], 
					    tj = types[j];
					Vector3<float> vi = polygon._vertices[i], 
					               vj = polygon._vertices[j];
					if (ti != BACK) f.push_back(vi);
					if (ti != FRONT) b.push_back(vi);
					if ((ti | tj) == SPANNING) 
					{
						float t = (_w - _normal.dot(vi)) / _normal.dot(vj.subtract(vi));
						Vector3<float> v = vi.lerp(vj, t);
						f.push_back(v);
						b.push_back(v);
					}
				}
				if (f.size() >= 3)
					addPolygon(f, front);
				if (b.size() >= 3)
					addPolygon(b, back);
				break;
		}
	}
private:
	void addPolygon(vector<Vector3<float>>& points, vector<Triangle>& triangles) const {
		for(int index=2; index<points.size(); index++)
			triangles.push_back(Triangle(points[0], points[index-1], points[index]));
	}
	int classify(Vector3<float> point) const {
		float loc = _normal.dot(point) - _w;
		return loc < -EPSILON ? BACK : 
		      (loc > +EPSILON ? FRONT : COPLANAR);
	}
	Vector3<float> _vertices[3];
	Vector3<float> _normal;
	float _w;
};

class BSPTree {
public:
	BSPTree(const vector<Triangle>& triangles): _front(0), _back(0) {
		build(triangles);
	}
	
	//rule of three
	BSPTree(const BSPTree& other) : _node(other._node), _content(other._content), _front(0), _back(0) {
		if(other._front) _front = new BSPTree(*other._front);
		if(other._back) _back = new BSPTree(*other._back);
	}
	~BSPTree() {
		if(_front) delete _front;
		if(_back) delete _back;
	}
	BSPTree& operator= (const BSPTree& other) { 
		if(_front) delete _front;
		if(_back) delete _back;
		_front = 0;
		_back = 0;
		_node = other._node;
		_content = other._content;
		if(other._front) _front = new BSPTree(*other._front);
		if(other._back) _back = new BSPTree(*other._back);
		return *this; 
	}
	
	const BSPTree* front() const { return _front; }
	const BSPTree* back() const { return _back; }
	const vector<Triangle>& content() const { return _content; }
	const Triangle& node() const { return _node; }
	const bool empty() const { return _content.size() == 0; }
	
	vector<Triangle> toList() const {
		vector<Triangle> result = _content;
		vector<Triangle> frontList;
		vector<Triangle> backList;
		if(_front) frontList = _front->toList();
		if(_back) backList = _back->toList();
		result.insert(result.end(), frontList.begin(), frontList.end());
		result.insert(result.end(), backList.begin(), backList.end());
		return result;
	}
	
	void clipTo(const BSPTree& other) {
		_content = other.clip(_content);
		if(_front) { 
			_front->clipTo(other);
			/*if(_front->empty()) {
				delete _front;
				_front = 0;
			}*/
		}
		if(_back) {
			_back->clipTo(other);
			/*if(_back->empty()) {
				delete _back;
				_back = 0;
			}*/
		}
	}
	void invert() {
		_node.flip();
		for(vector<Triangle>::iterator it=_content.begin(); it!=_content.end(); it++)
			it->flip();
		if(_front) _front->invert();
		if(_back) _back->invert();
		swap(_front, _back);
	}
	
	static inline BSPTree Union(const BSPTree& A, const BSPTree& B) {
		BSPTree a = A;
		BSPTree b = B;
		a.clipTo(b);
		b.clipTo(a);
		b.invert();
		b.clipTo(a);
		b.invert();
		a.build(b.toList());
		return BSPTree(a.toList());
	}

	static inline BSPTree Subtract(const BSPTree& A, const BSPTree& B) {
		BSPTree a = A;
		BSPTree b = B;
		a.invert();
		a.save("1.a.json");
		a.clipTo(b);
		a.save("2.a.json");
		b.clipTo(a);
		b.save("3.b.json");
		b.invert();
		b.save("4.b.json");
		b.clipTo(a);
		b.save("5.b.json");
		b.invert();
		b.save("6.b.json");
		a.build(b.toList());
		a.save("7.a.json");
		a.invert();
		a.save("8.a.json");
		return BSPTree(a.toList());
	}

	static inline BSPTree Intersect(const BSPTree& A, const BSPTree& B) {
		BSPTree a = A;
		BSPTree b = B;
		a.invert();
		b.clipTo(a);
		b.invert();
		a.clipTo(b);
		b.clipTo(a);
		a.build(b.toList());
		a.invert();
		return BSPTree(a.toList());
	}
	
	string toString() {
		vector<Triangle> list = toList();
		std::stringstream stream;
		stream << "[";
		for(int index=0; index<list.size(); index++) {
			if(index > 0)
				stream << ", ";
			stream << list[index].toString();
		}
		stream << "]";
		return stream.str();
	}
	
	void save(const char* fileName) {
		string input = toString();
		std::ofstream out(fileName);
		out << input;
	}
private:
	vector<Triangle> clip(const vector<Triangle>& triangles) const {
		vector<Triangle> frontList, backList;
		for(int index=0; index<triangles.size(); index++) 
			_node.split(triangles[index], frontList, backList, frontList, backList);
		if(_front) frontList = _front->clip(frontList);
		if(_back) backList = _back->clip(backList); else backList.clear();
		frontList.insert(frontList.end(), backList.begin(), backList.end());
		return frontList;
	}
	void build(const vector<Triangle>& triangles) {
		if(!triangles.size()) 
			return;
		int first;
		if(_content.size())
			first = 0;
		else {
			first = 1;
			_content.push_back(_node = triangles[0]);
		}
		vector<Triangle> front, back;
		for(int index=first; index<triangles.size(); index++)
			_node.split(triangles[index], _content, _content, front, back);
		if(front.size()) {
			if(!_front)
				_front = new BSPTree(front);
			else
				_front->build(front);
		}
		if(back.size()) {
			if(!_back) 
				_back = new BSPTree(back);
			else
				_back->build(back);
		}
	}
	Triangle _node;
	vector<Triangle> _content;
	BSPTree* _front;
	BSPTree* _back;
};
#endif