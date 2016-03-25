#ifndef OBJECT_H
#define OBJECT_H

#include "boundingbox.h"
#include <iostream>
#include <cstring>
#include <string>
#include <boost/regex.hpp>
#include <boost/algorithm/string.hpp>
#include <boost/algorithm/string/trim.hpp>
#include <fstream>
#include <algorithm>
#include <vector>
#include <list>
#include <sstream>
#include <math.h>
#include <ctime>
#include "vector.h"
#include "vertex.h"
#include "face.h"
#include <tuple>

using namespace std;

typedef tuple<string, int, int, int, int, int, int> RawFace; //material, ap, at, bp, bt, cp, ct

class Object {
public:
	Object(const Object& original): positions(original.positions), textures(original.textures), faces(original.faces), _libraries(original._libraries) {}
	Object(const char* fileName) {
		ifstream infile(fileName);
		if(!infile)
			throw "File does not exist!";
		string line;
    string material;
		while (getline(infile, line)) {
      boost::regex useMaterialPattern("[^#]*usemtl +([^#]*).*"); 
      boost::regex materialLibPattern("[^#]*mtllib +([^#]*).*"); 
			boost::regex vertexPattern("[^#]*v +([\\d|\\.|\\+|\\-|e|E]+) +([\\d|\\.|\\+|\\-|e|E]+) +([\\d|\\.|\\+|\\-|e|E]+).*");
			boost::regex texturePattern("[^#]*vt +([\\d|\\.|\\+|\\-|e|E]+) +([\\d|\\.|\\+|\\-|e|E]+).*");
			boost::regex facePattern1("[^#]*f +(\\d+) +(\\d+) +(\\d+).*");
			boost::regex facePattern2("[^#]*f +(\\d+)/(\\d+) +(\\d+)/(\\d+) +(\\d+)/(\\d+).*");
			boost::regex facePattern3("[^#]*f +(\\d+)/(\\d+)/\\d+ +(\\d+)/(\\d+)/\\d+ +(\\d+)/(\\d+)/\\d+.*");
			boost::regex facePattern4("[^#]*f +(\\d+)//\\d+ +(\\d+)//\\d+ +(\\d+)//\\d+.*");
			boost::match_results<std::string::const_iterator> match;
			if(boost::regex_match(line, match, vertexPattern)) {
				addPosition(match[1].str(), match[2].str(), match[3].str());
			}
      else if(boost::regex_match(line, match, useMaterialPattern)) {
        string str = match[1].str();
        boost::algorithm::trim(str);
        material = str;
      }
      else if(boost::regex_match(line, match, materialLibPattern)) {
        string str = match[1].str();
        boost::split(_libraries, str, boost::is_any_of(" \t"));
      }
      else if(boost::regex_match(line, match, texturePattern)) {
        addTexture(match[1].str(), match[2].str());
      }
			else if(boost::regex_match(line, match, facePattern1)) {
				addFace(material.c_str(), match[1].str(), match[2].str(), match[3].str());
			}
			else if(boost::regex_match(line, match, facePattern2)) {
				addFace(material.c_str(), match[1].str(), match[2].str(), match[3].str(), match[4].str(), match[5].str(), match[6].str());
			}
			else if(boost::regex_match(line, match, facePattern3)) {
				addFace(material.c_str(), match[1].str(), match[2].str(), match[3].str(), match[4].str(), match[5].str(), match[6].str());
			}
			else if(boost::regex_match(line, match, facePattern4)) {
				addFace(material.c_str(), match[1].str(), match[2].str(), match[3].str());
			}
		}
    for(auto& lib: _libraries)
      boost::algorithm::trim(lib);
	}
	BoundingBox bbox() {
		BoundingBox box;
		for(auto position: positions)
			box.add(position);
		return box;
	}
  vector<Face> extractFaces() {
    const Vector3<float> nullVector(0, 0, 0);
    vector<Face> result;
    for(auto face: faces) {
      string material = get<0>(face);
      int api = get<1>(face);
      int ati = get<2>(face);
      int bpi = get<3>(face);
      int bti = get<4>(face);
      int cpi = get<5>(face);
      int cti = get<6>(face);
      auto ap = positions[api];
      auto bp = positions[bpi];
      auto cp = positions[bpi];
      auto at = ati == -1 ? nullVector : textures[ati];
      auto bt = bti == -1 ? nullVector : textures[bti];
      auto ct = cti == -1 ? nullVector : textures[cti];
      Vertex a(ap.x, ap.y, ap.z, at.x, at.y);
      Vertex b(bp.x, bp.y, bp.z, bt.x, bt.y);
      Vertex c(cp.x, cp.y, cp.z, ct.x, ct.y);
      result.push_back(Face(material.c_str(), a, b, c));
    }
    return result;
  }
  vector<string> libraries() {
    return _libraries;
  }
	void normalize() {
		BoundingBox box = bbox();
		Vector3<float> size = box.size();
		float scale = 1.0f / fmaxf(size.x, fmaxf(size.y, size.z));
		for(auto& position: positions) {
			position.x = (position.x - box.min.x) * scale;
			position.y = (position.y - box.min.y) * scale;
			position.z = (position.z - box.min.z) * scale;
		}
	}
	void translate(Vector3<float> translation) {
		for(auto& position: positions) {
			position.x += translation.x;
			position.y += translation.y;
			position.z += translation.z;
		}
	}
	void scale(Vector3<float> scale) {
		for(auto& position: positions) {
			position.x *= scale.x;
			position.y *= scale.y;
			position.z *= scale.z;
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
  void addPosition(const string& xs, const string& ys, const string& zs) {
		float x = toFloat(xs);
		float y = toFloat(ys);
		float z = toFloat(zs);
		positions.push_back(Vector3<float>(x, y, z));
	}
  void addTexture(const string& us, const string& vs) {
    float u = toFloat(us);
		float v = toFloat(vs);
    textures.push_back(Vector3<float>(u, v, 0));
  }
	void addFace(const char* material, const string& aps, const string& bps, const string& cps) {
		auto ap = toInt(aps)-1;
		auto bp = toInt(bps)-1;
		auto cp = toInt(cps)-1;
		faces.push_back(RawFace(material, ap, -1, bp, -1, cp, -1));
	}
  void addFace(const char* material, const string& aps, const string& ats, const string& bps, const string& bts, const string& cps, const string& cts) {
		auto ap = toInt(aps)-1;
    auto at = toInt(ats)-1;
		auto bp = toInt(bps)-1;
		auto bt = toInt(bts)-1;
    auto cp = toInt(cps)-1;
    auto ct = toInt(cts)-1;
		faces.push_back(RawFace(material, ap, at, bp, bt, cp, ct));
	}
	vector<Vector3<float>> positions;
	vector<Vector3<float>> textures; //use x as u and y as v, z is unused
	vector<RawFace> faces;
  vector<string> _libraries;
};

#endif