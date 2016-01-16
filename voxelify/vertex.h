#ifndef VERTEX_H
#define VERTEX_H

class Vertex {
public:
  float x;
  float y;
  float z;
  float u;
  float v;
  
  Vertex(float x, float y, float z, float u = 0, float v = 0)
    : x(x), y(y), z(z), u(u), v(v) {}
    
  Vertex lerp(const Vertex& other, float factor) const {
    float invFactor = 1 - factor;
    return Vertex(
      x * invFactor + other.x * factor,
      y * invFactor + other.y * factor,
      z * invFactor + other.z * factor,
      u * invFactor + other.u * factor,
      v * invFactor + other.v * factor
    );
  }
};

#endif