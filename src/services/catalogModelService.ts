import * as catalogModelRepository from "../repositories/catalogModelRepository";

type ListInput = {
  gender?: string;
  age?: string;
  primaryLabel?: string;
  keyword?: string;
};

export const listCatalog = async (input: ListInput) => {
  const items = await catalogModelRepository.listActive(input);
  return items.map((m) => ({
    id: m.id,
    name: m.name,
    gender: m.gender,
    age: m.age,
    primaryLabel: m.primaryLabel,
    faceImageUrl: m.faceImageUrl,
  }));
};

export const getTotalCount = () => catalogModelRepository.countActive();
