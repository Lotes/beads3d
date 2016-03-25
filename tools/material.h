#ifndef MATERIAL_H
#define MATERIAL_H

#include <vector>
#include <map>
#include <string>
#include <fstream>
#include <iostream>
#include <boost/algorithm/string/predicate.hpp>
#include <boost/algorithm/string/case_conv.hpp>
#include <boost/algorithm/string/join.hpp>

using namespace std;
using namespace boost::filesystem;
using namespace boost::algorithm;

class Material {
public:
  Material(const char* fileName, bool convert2Png = true): _fileName(fileName) {
    ifstream infile(fileName);
    string line;
    string currentMaterial;
    while (getline(infile, line)) {
      trim(line);
      vector<string> values;
      boost::split(values, line, boost::is_any_of(" \t"));
      if(values[0][0] == '#')
        continue;
      
      if(values[0] == "newmtl") {
        currentMaterial = values[1];
      } else if(starts_with(values[0], "map_")) {
        int lastIndex = values.size()-1;
        string map = values[lastIndex];
        if(convert2Png) {
          auto lower = to_lower_copy(map);
          if(ends_with(lower, ".tga"))
            values[lastIndex] = map = map.substr(0, map.length() - 3) + "png";  
        }        
        if(_textures.find(currentMaterial) == _textures.end()) {
          std::map<string,string> emp;
          _textures[currentMaterial] = emp;
        }
        _textures[currentMaterial][values[0]] = map;
      }
      _lines.push_back(values);
    }
  }
  vector<string> getMaterialNames() const {
    vector<string> result;
    for(auto it: _textures)
      result.push_back(it.first);
    return result;
  }
  const char* fileName() const {
    return _fileName.c_str();
  }
  std::map<string,string> getTextures(const string& materialName) const {
    return _textures.at(materialName);
  }
  void save(const char* fileName) const {
    ofstream out(fileName);
    for(auto values: _lines)
      out << join(values, " ") << endl;
    out.flush();
    out.close();
  }
private:
  string _fileName;
  vector<vector<string>> _lines;
  map<string,map<string,string>> _textures;
};

#endif