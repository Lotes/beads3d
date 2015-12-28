#include <iostream>
#include <string>
#include <boost/regex.hpp>
#include <fstream>
#include <list>
#include <sstream>
 
using namespace std;

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

template<class T>
struct Vector2 {
public:
	T x;
	T y;
	Vector2(T x, T y) {
		this->x = x;
		this->y = y;
	}
};

template<class T>
struct Vector3 {
public:
	T x;
	T y;
	T z;
	Vector3(T x, T y, T z) {
		this->x = x;
		this->y = y;
		this->z = z;
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
				cout << "FACE1: " << line << endl;
				addFace(match[1].str(), match[2].str(), match[3].str());
			}
			else if(boost::regex_match(line, match, facePattern2)) {
				cout << "FACE2: " << line << endl;
				addFace(match[1].str(), match[2].str(), match[3].str());
			}
			else if(boost::regex_match(line, match, facePattern3)) {
				cout << "FACE3: " << line << endl;
				addFace(match[1].str(), match[2].str(), match[3].str());
			}
			else if(boost::regex_match(line, match, facePattern4)) {
				cout << "FACE4: " << line << endl;
				addFace(match[1].str(), match[2].str(), match[3].str());
			}
		}
	}
private:
	void addVertex(const string& xs, const string& ys, const string& zs) {
		double x = toDouble(xs);
		double y = toDouble(ys);
		double z = toDouble(zs);
		Vector3<double> v(x, y, z);
		vertices.push_back(v);
	}
	void addFace(const string& as, const string& bs, const string& cs) {
		int a = toInt(as);
		int b = toInt(bs);
		int c = toInt(cs);
		Vector3<int> f(a, b, c);
		faces.push_back(f);
	}
	list<Vector3<double>> vertices;
	list<Vector3<int>> faces;
};

int main() {
	Object obj("../models/pikachu.obj");
	return 0;
}