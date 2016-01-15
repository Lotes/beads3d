#ifndef FACE_H
#define FACE_H

#include "vector.h"
#include <vector>

using namespace std;

class Face {
public:
  Vector3<float> a;
  Vector3<float> b;
  Vector3<float> c;

  Face(Vector3<float> a, Vector3<float> b, Vector3<float> c) : a(a), b(b), c(c) {}
  
  vector<Face> split() const {
    vector<Face> result;
    Vector3<float> ab = a.add(b).multiplyScalar(0.5f);
    Vector3<float> bc = b.add(c).multiplyScalar(0.5f);
    Vector3<float> ac = a.add(c).multiplyScalar(0.5f);
    result.push_back(Face(a, ab, ac));
    result.push_back(Face(b, ab, bc));
    result.push_back(Face(c, bc, ac));
    result.push_back(Face(ab, bc, ac));
    return result;
  }
}; 

#endif